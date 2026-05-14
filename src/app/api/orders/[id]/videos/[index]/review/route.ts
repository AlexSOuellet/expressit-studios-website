import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrderForToken, MAX_REVISIONS } from "@/lib/orders";
import { supabaseAdmin } from "@/lib/supabase/server";
import { checkOrigin, rateLimit } from "@/lib/api/guards";
import { deriveOrderStatus } from "@/lib/admin";
import type { OrderVideoStatus } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Customer's review action on a finished video. Token-gated like the rest of
// the /api/orders routes: the access token is the only gate.
const bodySchema = z.object({
  token: z.string().min(1).max(1024),
  decision: z.enum(["approve", "request_revisions"]),
  note: z.string().max(2000).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; index: string }> }
) {
  const originErr = checkOrigin(req);
  if (originErr) return originErr;

  const limited = rateLimit(req, { key: "video-review", limit: 30, windowMs: 10 * 60_000 });
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
  if (video.status !== "awaiting_approval") {
    return NextResponse.json(
      { error: "This video isn't waiting for your review." },
      { status: 409 }
    );
  }

  const supabase = supabaseAdmin();

  if (parsed.decision === "approve") {
    const { error } = await supabase
      .from("order_videos")
      .update({ status: "delivered" })
      .eq("order_id", id)
      .eq("video_index", videoIndex);
    if (error) {
      console.error("[review] approve failed", error);
      return NextResponse.json({ error: "Server error." }, { status: 500 });
    }
  } else {
    if (video.revision_count >= MAX_REVISIONS) {
      return NextResponse.json(
        {
          error: `You've used all ${MAX_REVISIONS} revisions for this video. Please approve it, or reach out if something's still off.`,
        },
        { status: 409 }
      );
    }
    const note = parsed.note?.trim() || null;
    const { error } = await supabase
      .from("order_videos")
      .update({
        status: "revisions_requested",
        revision_count: video.revision_count + 1,
        revision_note: note,
      })
      .eq("order_id", id)
      .eq("video_index", videoIndex);
    if (error) {
      console.error("[review] revision request failed", error);
      return NextResponse.json({ error: "Server error." }, { status: 500 });
    }
  }

  // Recompute the order's overall status from all of its videos.
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

  return NextResponse.json({ ok: true });
}
