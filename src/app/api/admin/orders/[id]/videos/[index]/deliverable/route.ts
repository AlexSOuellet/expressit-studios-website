import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { checkOrigin, rateLimit } from "@/lib/api/guards";
import { deriveOrderStatus } from "@/lib/admin";
import type { OrderRow, OrderVideoStatus } from "@/lib/orders";
import { sendAwaitingApproval } from "@/lib/emails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Confirms a finished-video upload: records the storage path on the video row
// and moves it to awaiting_approval so the customer can review it. Auth via
// the Basic Auth proxy; Origin checked (Basic Auth replays cross-site).

const bodySchema = z.object({
  path: z.string().min(1).max(1024),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; index: string }> }
) {
  const originErr = checkOrigin(req);
  if (originErr) return originErr;

  const limited = rateLimit(req, { key: "deliverable", limit: 60, windowMs: 10 * 60_000 });
  if (limited) return limited;

  const { id, index } = await params;
  const videoIndex = Number.parseInt(index, 10);
  if (!Number.isInteger(videoIndex) || videoIndex < 1) {
    return NextResponse.json({ error: "Bad video index." }, { status: 400 });
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // The uploaded file must live in this order/video's folder.
  const prefix = `${id}/video-${videoIndex}/`;
  if (!parsed.path.startsWith(prefix)) {
    return NextResponse.json(
      { error: "Upload path outside this video's folder." },
      { status: 400 }
    );
  }

  const supabase = supabaseAdmin();
  const { data: video } = await supabase
    .from("order_videos")
    .select("status")
    .eq("order_id", id)
    .eq("video_index", videoIndex)
    .maybeSingle();

  if (!video) {
    return NextResponse.json({ error: "Unknown video slot." }, { status: 404 });
  }
  if (video.status !== "in_editing" && video.status !== "revisions_requested") {
    return NextResponse.json(
      { error: "A video can only be delivered while it's in editing." },
      { status: 409 }
    );
  }

  // Confirm the object actually landed in storage.
  const { data: listed, error: listErr } = await supabase.storage
    .from("order-deliverables")
    .list(prefix.replace(/\/$/, ""), { limit: 100 });
  if (listErr) {
    console.error("[deliverable] list failed", listErr);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
  const present = new Set((listed ?? []).map((o) => `${prefix}${o.name}`));
  if (!present.has(parsed.path)) {
    return NextResponse.json(
      { error: "Upload not found — please re-upload and try again." },
      { status: 409 }
    );
  }

  const { error: updateErr } = await supabase
    .from("order_videos")
    .update({
      deliverable_path: parsed.path,
      status: "awaiting_approval",
      revision_note: null,
    })
    .eq("order_id", id)
    .eq("video_index", videoIndex);
  if (updateErr) {
    console.error("[deliverable] update video failed", updateErr);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }

  // Recompute the order's overall status.
  const { data: allVideos } = await supabase
    .from("order_videos")
    .select("status")
    .eq("order_id", id);
  if (allVideos) {
    const orderStatus = deriveOrderStatus(
      allVideos.map((v) => v.status as OrderVideoStatus)
    );
    await supabase.from("orders").update({ status: orderStatus }).eq("id", id);
  }

  const { data: orderRow } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (orderRow) {
    const videoCount = allVideos?.length ?? 1;
    await sendAwaitingApproval(orderRow as OrderRow, videoIndex, videoCount);
  }

  return NextResponse.json({ ok: true });
}
