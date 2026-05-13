import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// SECURITY: This client uses SUPABASE_SECRET_KEY and bypasses RLS. It must
// never run in the browser. The `orders` table has RLS enabled with zero
// policies, so any browser-side anon-key access would be denied — that's the
// only thing keeping order data private. Do NOT introduce a browser Supabase
// client without first adding row-level policies that restrict reads to the
// authenticated owner (Phase 2 step 3, magic-link auth).
let cached: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local."
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
