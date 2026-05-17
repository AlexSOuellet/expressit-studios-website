import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getDeliverableUrl } from "@/lib/orders";
import type { OrderRow, OrderVideoRow, OrderVideoStatus, OrderStatus } from "@/lib/orders";

// Admin-side data access. Every function here runs behind the HTTP Basic Auth
// proxy (see src/proxy.ts) and uses the service-role client, so it reads
// across all orders regardless of access token.

export type AdminUpload = {
  id: string;
  video_index: number;
  storage_path: string;
  original_filename: string;
  size_bytes: number;
  mime_type: string;
  uploaded_at: string;
};

export type AdminUploadWithUrls = AdminUpload & {
  viewUrl: string | null;
  downloadUrl: string | null;
};

export type AdminVideo = OrderVideoRow & {
  uploads: AdminUploadWithUrls[];
  deliverableUrl: string | null;
};

export type AdminOrderListItem = OrderRow & {
  videos: Pick<OrderVideoRow, "video_index" | "status">[];
};

export type AdminOrderDetail = OrderRow & {
  updated_at: string;
  videos: AdminVideo[];
};

const SIGNED_URL_TTL = 60 * 60; // 1 hour

export async function listAllOrders(
  opts: { includeTest?: boolean } = {}
): Promise<AdminOrderListItem[]> {
  const supabase = supabaseAdmin();
  let query = supabase
    .from("orders")
    .select("*, videos:order_videos(video_index, status)")
    .order("created_at", { ascending: false });

  // Default to live orders only so the dashboard isn't polluted with
  // localhost / Stripe-CLI test traffic. Admin can opt in to seeing
  // everything via ?test=1.
  if (!opts.includeTest) {
    query = query.eq("livemode", true);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as AdminOrderListItem[]).map((o) => ({
    ...o,
    videos: [...o.videos].sort((a, b) => a.video_index - b.video_index),
  }));
}

export async function getAdminOrder(
  id: string
): Promise<AdminOrderDetail | null> {
  if (!id) return null;
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from("orders")
    .select("*, videos:order_videos(*)")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;

  const { data: uploadRows } = await supabase
    .from("uploads")
    .select("*")
    .eq("order_id", id)
    .order("uploaded_at", { ascending: true });

  const uploads = (uploadRows ?? []) as AdminUpload[];

  // Batch signed URLs for the customer's photos: one inline-view URL for the
  // thumbnail and one Content-Disposition URL so the admin can download the
  // original file. The bucket is private; links expire after the TTL.
  const paths = uploads.map((u) => u.storage_path);
  const viewByPath = new Map<string, string>();
  const downloadByPath = new Map<string, string>();
  if (paths.length > 0) {
    const [viewRes, downloadRes] = await Promise.all([
      supabase.storage.from("order-uploads").createSignedUrls(paths, SIGNED_URL_TTL),
      supabase.storage
        .from("order-uploads")
        .createSignedUrls(paths, SIGNED_URL_TTL, { download: true }),
    ]);
    for (const s of viewRes.data ?? []) {
      if (s.signedUrl && s.path) viewByPath.set(s.path, s.signedUrl);
    }
    for (const s of downloadRes.data ?? []) {
      if (s.signedUrl && s.path) downloadByPath.set(s.path, s.signedUrl);
    }
  }

  const rawVideos = data.videos as OrderVideoRow[];
  const videos: AdminVideo[] = await Promise.all(
    rawVideos.map(async (v) => ({
      ...v,
      uploads: uploads
        .filter((u) => u.video_index === v.video_index)
        .map((u) => ({
          ...u,
          viewUrl: viewByPath.get(u.storage_path) ?? null,
          downloadUrl: downloadByPath.get(u.storage_path) ?? null,
        })),
      deliverableUrl: v.deliverable_path
        ? await getDeliverableUrl(v.deliverable_path)
        : null,
    }))
  );
  videos.sort((a, b) => a.video_index - b.video_index);

  return { ...(data as OrderRow & { updated_at: string }), videos };
}

// Manual transitions the admin can apply from the dashboard. The other moves
// happen elsewhere: in_editing -> awaiting_approval when the admin uploads a
// deliverable, and awaiting_approval -> delivered | revisions_requested from
// the customer's review action. `delivered` is terminal.
const VIDEO_TRANSITIONS: Record<OrderVideoStatus, OrderVideoStatus[]> = {
  awaiting_photos: [],
  photos_received: ["in_editing"],
  in_editing: ["photos_received"],
  awaiting_approval: ["in_editing"],
  revisions_requested: ["in_editing"],
  delivered: [],
};

export function canTransitionVideo(
  from: OrderVideoStatus,
  to: OrderVideoStatus
): boolean {
  return VIDEO_TRANSITIONS[from]?.includes(to) ?? false;
}

// Lower rank = less advanced. The order trails its least-advanced video.
const STATUS_RANK: Record<OrderVideoStatus, number> = {
  awaiting_photos: 0,
  photos_received: 1,
  revisions_requested: 2,
  in_editing: 2,
  awaiting_approval: 3,
  delivered: 4,
};

export function deriveOrderStatus(
  videoStatuses: OrderVideoStatus[]
): OrderStatus {
  if (videoStatuses.length === 0) return "awaiting_photos";

  let least = videoStatuses[0]!;
  for (const s of videoStatuses) {
    if (STATUS_RANK[s] < STATUS_RANK[least]) least = s;
  }
  return least;
}
