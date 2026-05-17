import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";

// Single source of truth for "delete every Stripe test-mode order plus its
// children and storage files". Used by both the CLI (scripts/wipe-test-data.mjs
// — re-implemented in plain Node because it runs outside Next) and the admin
// button at /admin/wipe-test.
//
// Live-mode rows (orders.livemode = true) are NEVER touched. The predicate is
// hard-coded; there is no "wipe everything" path on purpose.

export type WipeTestSummary = {
  orders: number;
  uploadFiles: number;
  deliverableFiles: number;
};

export async function previewTestData(): Promise<WipeTestSummary> {
  const supabase = supabaseAdmin();

  const { data: orders } = await supabase
    .from("orders")
    .select("id")
    .eq("livemode", false);
  const ids = (orders ?? []).map((o) => o.id);

  if (ids.length === 0) {
    return { orders: 0, uploadFiles: 0, deliverableFiles: 0 };
  }

  const { data: uploads } = await supabase
    .from("uploads")
    .select("storage_path")
    .in("order_id", ids);
  const { data: videos } = await supabase
    .from("order_videos")
    .select("deliverable_path")
    .in("order_id", ids)
    .not("deliverable_path", "is", null);

  return {
    orders: ids.length,
    uploadFiles: (uploads ?? []).length,
    deliverableFiles: (videos ?? []).filter((v) => v.deliverable_path).length,
  };
}

export async function wipeTestData(): Promise<WipeTestSummary> {
  const supabase = supabaseAdmin();

  const { data: orders } = await supabase
    .from("orders")
    .select("id")
    .eq("livemode", false);
  const ids = (orders ?? []).map((o) => o.id);

  if (ids.length === 0) {
    return { orders: 0, uploadFiles: 0, deliverableFiles: 0 };
  }

  // Collect storage paths first; once the rows are gone we can't find them.
  const { data: uploads } = await supabase
    .from("uploads")
    .select("storage_path")
    .in("order_id", ids);
  const { data: videos } = await supabase
    .from("order_videos")
    .select("deliverable_path")
    .in("order_id", ids)
    .not("deliverable_path", "is", null);

  const uploadPaths = (uploads ?? [])
    .map((u) => u.storage_path)
    .filter((p): p is string => !!p);
  const deliverablePaths = (videos ?? [])
    .map((v) => v.deliverable_path)
    .filter((p): p is string => !!p);

  // Storage first (orphan rows are recoverable; orphan files cost money and
  // never expire on their own).
  if (uploadPaths.length > 0) {
    await supabase.storage.from("order-uploads").remove(uploadPaths);
  }
  if (deliverablePaths.length > 0) {
    await supabase.storage.from("order-deliverables").remove(deliverablePaths);
  }

  // Children before parents. FK cascades may handle this depending on the
  // schema, but explicit deletes are cheap and clear.
  await supabase.from("uploads").delete().in("order_id", ids);
  await supabase.from("order_videos").delete().in("order_id", ids);
  await supabase.from("orders").delete().in("id", ids);

  return {
    orders: ids.length,
    uploadFiles: uploadPaths.length,
    deliverableFiles: deliverablePaths.length,
  };
}
