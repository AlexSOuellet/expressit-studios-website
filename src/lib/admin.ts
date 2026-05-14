import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type {
  OrderRow,
  OrderVideoRow,
  OrderVideoStatus,
  OrderStatus,
} from "@/lib/orders";

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

export type AdminVideo = OrderVideoRow & {
  vibe: string | null;
  uploads: (AdminUpload & { signedUrl: string | null })[];
};

export type AdminOrderListItem = OrderRow & {
  delivered_video_url: string | null;
  videos: Pick<OrderVideoRow, "video_index" | "status">[];
};

export type AdminOrderDetail = OrderRow & {
  delivered_video_url: string | null;
  updated_at: string;
  videos: AdminVideo[];
};

const SIGNED_URL_TTL = 60 * 60; // 1 hour

export async function listAllOrders(): Promise<AdminOrderListItem[]> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "*, videos:order_videos(video_index, status)"
    )
    .order("created_at", { ascending: false });

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

  // Batch a signed URL for each uploaded photo so the detail page can render
  // thumbnails. The bucket is private; these links expire after the TTL.
  const paths = uploads.map((u) => u.storage_path);
  const signedByPath = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("order-uploads")
      .createSignedUrls(paths, SIGNED_URL_TTL);
    for (const s of signed ?? []) {
      if (s.signedUrl && s.path) signedByPath.set(s.path, s.signedUrl);
    }
  }

  const videos = (data.videos as (OrderVideoRow & { vibe: string | null })[])
    .map((v) => ({
      ...v,
      uploads: uploads
        .filter((u) => u.video_index === v.video_index)
        .map((u) => ({ ...u, signedUrl: signedByPath.get(u.storage_path) ?? null })),
    }))
    .sort((a, b) => a.video_index - b.video_index);

  return { ...(data as OrderRow & { delivered_video_url: string | null; updated_at: string }), videos };
}

// Allowed forward transitions for a single video. The customer flow moves a
// video to photos_received; the admin moves it through editing to delivered.
const VIDEO_TRANSITIONS: Record<OrderVideoStatus, OrderVideoStatus[]> = {
  awaiting_photos: [],
  photos_received: ["in_editing"],
  in_editing: ["delivered", "photos_received"],
  delivered: ["in_editing"],
};

export function canTransitionVideo(
  from: OrderVideoStatus,
  to: OrderVideoStatus
): boolean {
  return VIDEO_TRANSITIONS[from]?.includes(to) ?? false;
}

// Derive the order's overall status from its videos. Kept deliberately simple:
// the order trails the least-advanced video.
export function deriveOrderStatus(
  videoStatuses: OrderVideoStatus[]
): OrderStatus {
  if (videoStatuses.length === 0) return "awaiting_photos";
  if (videoStatuses.every((s) => s === "delivered")) return "delivered";
  if (videoStatuses.some((s) => s === "awaiting_photos")) return "awaiting_photos";
  if (videoStatuses.some((s) => s === "in_editing" || s === "delivered")) {
    return "in_editing";
  }
  return "photos_received";
}
