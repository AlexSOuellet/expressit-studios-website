import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { checkOrigin, rateLimit } from "@/lib/api/guards";
import { canTransitionVideo, deriveOrderStatus } from "@/lib/admin";
import type { OrderVideoStatus } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Auth is handled by the Basic Auth proxy (src/proxy.ts). We still check
// Origin: Basic Auth credentials are replayed by the browser on any
// cross-site request, so this route is otherwise CSRF-able.

const bodySchema = z.object({
  status: z.enum(["photos_received", "in_editing", "delivered"]),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; index: string }> }
) {
  const originErr = checkOrigin(req);
  if (originErr) return originErr;

  const limited = rateLimit(req, { key: "admin-status", limit: 120, windowMs: 10 * 60_000 });
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

  const supabase = supabaseAdmin();
  const { data: video, error: fetchErr } = await supabase
    .from("order_videos")
    .select("status")
    .eq("order_id", id)
    .eq("video_index", videoIndex)
    .maybeSingle();

  if (fetchErr || !video) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const from = video.status as OrderVideoStatus;
  if (!canTransitionVideo(from, parsed.status)) {
    return NextResponse.json(
      { error: `Can't move a video from ${from} to ${parsed.status}.` },
      { status: 409 }
    );
  }

  const { error: updateErr } = await supabase
    .from("order_videos")
    .update({ status: parsed.status })
    .eq("order_id", id)
    .eq("video_index", videoIndex);
  if (updateErr) {
    console.error("[admin-status] update video failed", updateErr);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }

  // Recompute the order's overall status from all of its videos.
  const { data: allVideos, error: listErr } = await supabase
    .from("order_videos")
    .select("status")
    .eq("order_id", id);
  if (listErr || !allVideos) {
    console.error("[admin-status] reload videos failed", listErr);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }

  const orderStatus = deriveOrderStatus(
    allVideos.map((v) => v.status as OrderVideoStatus)
  );
  const { error: orderErr } = await supabase
    .from("orders")
    .update({ status: orderStatus })
    .eq("id", id);
  if (orderErr) {
    console.error("[admin-status] update order failed", orderErr);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, videoStatus: parsed.status, orderStatus });
}
