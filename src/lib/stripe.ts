import "server-only";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  // Don't throw at import time — keep dev server runnable without keys.
  // The API route checks for the key and returns a clear error if missing.
  console.warn(
    "[stripe] STRIPE_SECRET_KEY is not set. Checkout will fail until it is configured in .env.local."
  );
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_unset", {
  // Pin the API version so Stripe never silently breaks the integration.
  apiVersion: "2026-04-22.dahlia",
  typescript: true,
});

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}
