import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { checkOrigin, rateLimit } from "@/lib/api/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Sets orders.delivered_video_url — the link to the finished video the
// customer sees on their order page. Auth via Basic Auth proxy; Origin
// checked because Basic Auth credentials are replayed cross-site.

const bodySchema = z.object({
  url: z.string().trim().url().max(2048).nullable(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const originErr = checkOrigin(req);
  if (originErr) return originErr;

  const limited = rateLimit(req, { key: "admin-deliver", limit: 120, windowMs: 10 * 60_000 });
  if (limited) return limited;

  const { id } = await params;

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Provide a valid URL, or null to clear." }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!order) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const { error } = await supabase
    .from("orders")
    .update({ delivered_video_url: parsed.url })
    .eq("id", id);
  if (error) {
    console.error("[admin-deliver] update failed", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: parsed.url });
}
