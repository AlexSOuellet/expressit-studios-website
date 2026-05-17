import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// HMAC-signed unsubscribe tokens. The token is keyed off the order id and
// the server secret, so we don't need to persist a per-order unsubscribe
// token — verifying is recomputing. Using SUPABASE_SECRET_KEY as the key
// avoids introducing yet another env var; it's already a high-entropy
// secret that only ever lives server-side.

function secret(): string {
  const k = process.env.SUPABASE_SECRET_KEY;
  if (!k) throw new Error("SUPABASE_SECRET_KEY not set; cannot sign unsubscribe token");
  return k;
}

function sign(orderId: string): string {
  return createHmac("sha256", secret())
    .update(`unsub:${orderId}`)
    .digest("base64url");
}

export function signUnsubscribeToken(orderId: string): string {
  return sign(orderId);
}

export function verifyUnsubscribeToken(orderId: string, token: string): boolean {
  if (!orderId || !token) return false;
  const expected = Buffer.from(sign(orderId));
  const got = Buffer.from(token);
  if (expected.length !== got.length) return false;
  return timingSafeEqual(expected, got);
}

export function unsubscribeUrl(siteOrigin: string, orderId: string): string {
  const t = signUnsubscribeToken(orderId);
  return `${siteOrigin}/api/email/unsubscribe?o=${encodeURIComponent(orderId)}&t=${encodeURIComponent(t)}`;
}
