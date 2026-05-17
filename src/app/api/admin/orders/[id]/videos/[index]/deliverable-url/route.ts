import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { checkOrigin, rateLimit } from "@/lib/api/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Issues a signed upload URL so the admin can upload a finished video
// directly to the private order-deliverables bucket from the browser.
// Auth via the Basic Auth proxy (src/proxy.ts); Origin checked because
// Basic Auth credentials are replayed cross-site.

const ALLOWED_MIME = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
]);

const MAX_BYTES = 500 * 1024 * 1024; // 500 MB

// The video index comes from the URL path. We deliberately do NOT accept it
// in the body to remove any chance of URL-vs-body drift — past bug report
// (2026-05-15) had a finished video landing on the wrong video on the
// customer's order page; URL-only routing eliminates this whole category.
const bodySchema = z.object({
  filename: z.string().min(1).max(255),
  mime: z.string().min(1).max(64),
  size: z.number().int().positive().max(MAX_BYTES),
});

function safeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "video";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; index: string }> }
) {
  const originErr = checkOrigin(req);
  if (originErr) return originErr;

  const limited = rateLimit(req, { key: "deliverable-url", limit: 60, windowMs: 10 * 60_000 });
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

  if (!ALLOWED_MIME.has(parsed.mime)) {
    return NextResponse.json(
      { error: "Unsupported video type. Use MP4, MOV, WebM, or M4V." },
      { status: 415 }
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
      { error: "A video can only be uploaded while it's in editing." },
      { status: 409 }
    );
  }

  const path = `${id}/video-${videoIndex}/${Date.now()}-${safeFilename(
    parsed.filename
  )}`;

  const { data, error } = await supabase.storage
    .from("order-deliverables")
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error("[deliverable-url] signed url failed", error);
    return NextResponse.json({ error: "Could not create upload URL." }, { status: 500 });
  }

  return NextResponse.json({
    path: data.path,
    token: data.token,
    signedUrl: data.signedUrl,
  });
}
