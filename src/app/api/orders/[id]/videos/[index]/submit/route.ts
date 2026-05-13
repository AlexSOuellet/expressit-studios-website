import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrderForToken } from "@/lib/orders";
import { supabaseAdmin } from "@/lib/supabase/server";
import { checkOrigin, rateLimit } from "@/lib/api/guards";
import { isValidVibe } from "@/lib/vibes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const photoSchema = z.object({
  path: z.string().min(1).max(1024),
  filename: z.string().min(1).max(255),
  size: z.number().int().nonnegative(),
  mime: z.string().min(1).max(64),
});

const bodySchema = z.object({
  token: z.string().min(1).max(1024),
  vibe: z.string().max(64).nullable().optional(),
  brief: z.string().max(2000).default(""),
  photos: z.array(photoSchema).min(1).max(3),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; index: string }> }
) {
  const originErr = checkOrigin(req);
  if (originErr) return originErr;

  const limited = rateLimit(req, { key: "video-submit", limit: 20, windowMs: 10 * 60_000 });
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

  const order = await getOrderForToken(id, parsed.token);
  if (!order) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const video = order.videos.find((v) => v.video_index === videoIndex);
  if (!video) {
    return NextResponse.json({ error: "Unknown video slot." }, { status: 400 });
  }
  if (video.status !== "awaiting_photos") {
    return NextResponse.json({ error: "Already submitted." }, { status: 409 });
  }

  const vibe = parsed.vibe?.trim() || null;
  if (!isValidVibe(order.product_slug, vibe)) {
    return NextResponse.json({ error: "Invalid vibe." }, { status: 400 });
  }

  // Verify every photo path lives in this order/video folder, and every
  // referenced storage object actually exists. This prevents a client from
  // submitting paths it doesn't own or never uploaded.
  const prefix = `${order.id}/video-${videoIndex}/`;
  for (const p of parsed.photos) {
    if (!p.path.startsWith(prefix)) {
      return NextResponse.json(
        { error: "Photo path outside this video's folder." },
        { status: 400 }
      );
    }
  }

  const supabase = supabaseAdmin();
  const { data: existing, error: listErr } = await supabase.storage
    .from("order-uploads")
    .list(prefix.replace(/\/$/, ""), { limit: 100 });
  if (listErr) {
    console.error("[submit] list failed", listErr);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
  const presentNames = new Set((existing ?? []).map((o) => `${prefix}${o.name}`));
  for (const p of parsed.photos) {
    if (!presentNames.has(p.path)) {
      return NextResponse.json(
        { error: "Some uploads are missing — please re-upload and try again." },
        { status: 409 }
      );
    }
  }

  // Insert upload rows.
  const uploadRows = parsed.photos.map((p) => ({
    order_id: order.id,
    video_index: videoIndex,
    storage_path: p.path,
    original_filename: p.filename,
    size_bytes: p.size,
    mime_type: p.mime,
  }));
  const { error: insertErr } = await supabase.from("uploads").insert(uploadRows);
  if (insertErr) {
    console.error("[submit] insert uploads failed", insertErr);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }

  // Flip the video to photos_received.
  const { error: updateErr } = await supabase
    .from("order_videos")
    .update({
      brief: parsed.brief,
      vibe,
      status: "photos_received",
      submitted_at: new Date().toISOString(),
    })
    .eq("order_id", order.id)
    .eq("video_index", videoIndex);
  if (updateErr) {
    console.error("[submit] update video failed", updateErr);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }

  // If every video is now submitted, bump the order itself.
  const { data: pending } = await supabase
    .from("order_videos")
    .select("video_index", { count: "exact" })
    .eq("order_id", order.id)
    .eq("status", "awaiting_photos");
  if (pending && pending.length === 0) {
    await supabase
      .from("orders")
      .update({ status: "photos_received" })
      .eq("id", order.id);
  }

  return NextResponse.json({ ok: true });
}
