import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrderForToken } from "@/lib/orders";
import { supabaseAdmin } from "@/lib/supabase/server";
import { checkOrigin, rateLimit } from "@/lib/api/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  token: z.string().min(1).max(1024),
  path: z.string().min(1).max(1024),
});

// Deletes a not-yet-submitted upload from Storage. Idempotent. Refuses to
// delete anything outside this order's folder, so a stray path can't escape
// the sandbox.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const originErr = checkOrigin(req);
  if (originErr) return originErr;

  const limited = rateLimit(req, { key: "upload-delete", limit: 60, windowMs: 10 * 60_000 });
  if (limited) return limited;

  const { id } = await params;

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

  if (!parsed.path.startsWith(`${order.id}/`)) {
    return NextResponse.json({ error: "Path outside order folder." }, { status: 400 });
  }

  // Refuse if there's already a submitted uploads row for this path.
  const supabase = supabaseAdmin();
  const { data: existing } = await supabase
    .from("uploads")
    .select("id")
    .eq("storage_path", parsed.path)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Already submitted; can't delete." },
      { status: 409 }
    );
  }

  const { error } = await supabase.storage.from("order-uploads").remove([parsed.path]);
  if (error) {
    console.error("[upload-delete] failed", error);
    return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
