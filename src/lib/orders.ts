import "server-only";
import { timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/server";

export type OrderVideoStatus =
  | "awaiting_photos"
  | "photos_received"
  | "in_editing"
  | "awaiting_approval"
  | "revisions_requested"
  | "delivered";

export type OrderStatus =
  | "awaiting_photos"
  | "photos_received"
  | "in_editing"
  | "awaiting_approval"
  | "revisions_requested"
  | "delivered";

// How many times a customer may request revisions before they can only approve.
export const MAX_REVISIONS = 2;

export type OrderRow = {
  id: string;
  stripe_session_id: string;
  customer_email: string;
  product_slug: string;
  variant_id: string;
  options: Record<string, string>;
  price_cents: number;
  status: OrderStatus;
  access_token: string;
  livemode: boolean;
  created_at: string;
};

export type OrderVideoRow = {
  order_id: string;
  video_index: number;
  brief: string;
  vibe: string | null;
  status: OrderVideoStatus;
  submitted_at: string | null;
  deliverable_path: string | null;
  revision_count: number;
  revision_note: string | null;
};

export type OrderWithVideos = OrderRow & { videos: OrderVideoRow[] };

// Constant-time compare. Falls back to false on length mismatch.
function tokensMatch(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

// Load an order if and only if the caller's token matches. Returns null
// for both "no such order" and "wrong token" so callers can 404 without
// leaking existence.
export async function getOrderForToken(
  id: string,
  token: string
): Promise<OrderWithVideos | null> {
  if (!id || !token) return null;

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("*, videos:order_videos(*)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  if (!tokensMatch(data.access_token, token)) return null;

  const videos = (data.videos as OrderVideoRow[]).sort(
    (a, b) => a.video_index - b.video_index
  );
  return { ...(data as OrderRow), videos };
}

// Look up an order by its Stripe session id. Used by /checkout/success
// to deep-link the just-paid customer into their order page.
export async function getOrderBySessionId(
  sessionId: string
): Promise<OrderRow | null> {
  if (!sessionId) return null;
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();
  if (error || !data) return null;
  return data as OrderRow;
}

export function orderUrl(id: string, token: string): string {
  return `/order/${id}?t=${encodeURIComponent(token)}`;
}

// Short-lived signed URL for a finished video in the private
// order-deliverables bucket. Pass download:true to force a file download
// (sets Content-Disposition) instead of inline playback.
const DELIVERABLE_URL_TTL = 60 * 60; // 1 hour

export async function getDeliverableUrl(
  path: string,
  opts: { download?: boolean } = {}
): Promise<string | null> {
  if (!path) return null;
  const supabase = supabaseAdmin();
  const { data, error } = await supabase.storage
    .from("order-deliverables")
    .createSignedUrl(path, DELIVERABLE_URL_TTL, { download: opts.download ?? false });
  if (error || !data) return null;
  return data.signedUrl;
}
