import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrderForToken } from "@/lib/orders";
import { supabaseAdmin } from "@/lib/supabase/server";
import { checkOrigin, rateLimit } from "@/lib/api/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/webp",
]);

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB per photo
const MAX_PHOTOS_PER_VIDEO = 3;

const bodySchema = z.object({
  token: z.string().min(1).max(1024),
  video_index: z.number().int().positive(),
  filename: z.string().min(1).max(255),
  mime: z.string().min(1).max(64),
  size: z.number().int().nonnegative().max(MAX_BYTES),
});

function safeFilename(name: string): string {
  // Strip path components, keep extension, replace anything non-alphanumeric.
  const base = name.split(/[\\/]/).pop() ?? "photo";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const originErr = checkOrigin(req);
  if (originErr) return originErr;

  const limited = rateLimit(req, { key: "upload-url", limit: 60, windowMs: 10 * 60_000 });
  if (limited) return limited;

  const { id } = await params;

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!ALLOWED_MIME.has(parsed.mime)) {
    return NextResponse.json(
      { error: "Unsupported file type. Use JPEG, PNG, HEIC, or WebP." },
      { status: 415 }
    );
  }

  const order = await getOrderForToken(id, parsed.token);
  if (!order) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const video = order.videos.find((v) => v.video_index === parsed.video_index);
  if (!video) {
    return NextResponse.json({ error: "Unknown video slot." }, { status: 400 });
  }

  if (video.status !== "awaiting_photos") {
    return NextResponse.json(
      { error: "This video is already submitted." },
      { status: 409 }
    );
  }

  // Cap photos-per-video by counting prior uploads.
  const supabase = supabaseAdmin();
  const { count: existing, error: countErr } = await supabase
    .from("uploads")
    .select("id", { count: "exact", head: true })
    .eq("order_id", order.id)
    .eq("video_index", parsed.video_index);

  if (countErr) {
    console.error("[upload-url] count failed", countErr);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
  if ((existing ?? 0) >= MAX_PHOTOS_PER_VIDEO) {
    return NextResponse.json(
      { error: `Max ${MAX_PHOTOS_PER_VIDEO} photos per video.` },
      { status: 409 }
    );
  }

  const path = `${order.id}/video-${parsed.video_index}/${Date.now()}-${safeFilename(
    parsed.filename
  )}`;

  const { data, error } = await supabase.storage
    .from("order-uploads")
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error("[upload-url] signed url failed", error);
    return NextResponse.json({ error: "Could not create upload URL." }, { status: 500 });
  }

  return NextResponse.json({
    path: data.path,
    token: data.token,
    signedUrl: data.signedUrl,
  });
}
