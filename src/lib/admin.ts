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

// ───────────────────────────────────────────────────────────────────────────
// Dashboard helpers — KPIs, customer aggregation, recent activity.
// All numbers come from Supabase (orders.price_cents reflects exactly what
// Stripe charged). For Stripe-side fee/net breakdown we'd hit the Stripe API,
// not built yet — see SESSION-BRIEF.
// ───────────────────────────────────────────────────────────────────────────

export type DashboardKpis = {
  revenueAllTimeCents: number;
  revenueThisMonthCents: number;
  revenueThisWeekCents: number;
  ordersAllTime: number;
  ordersActive: number; // anything not delivered
  ordersAwaitingMe: number; // photos_received OR revisions_requested OR in_editing
};

export type PipelineCounts = Record<OrderStatus, number>;

export type CustomerSummary = {
  email: string;
  orderCount: number;
  totalSpentCents: number;
  firstOrderAt: string;
  lastOrderAt: string;
};

export type ActivityItem = {
  id: string;
  orderId: string;
  type: "order_placed" | "photos_submitted" | "delivered" | "revisions_requested";
  at: string;
  detail: string;
};

function startOfWeek(now = new Date()): Date {
  // Sunday-anchored to match Stripe's week boundaries; simple, no library.
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function startOfMonth(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function getDashboardData(
  opts: { includeTest?: boolean } = {}
): Promise<{
  kpis: DashboardKpis;
  pipeline: PipelineCounts;
  recentOrders: AdminOrderListItem[];
}> {
  const supabase = supabaseAdmin();
  let q = supabase
    .from("orders")
    .select("*, videos:order_videos(video_index, status)")
    .order("created_at", { ascending: false });
  if (!opts.includeTest) q = q.eq("livemode", true);
  const { data } = await q;
  const orders = (data ?? []) as AdminOrderListItem[];

  const weekStart = startOfWeek().getTime();
  const monthStart = startOfMonth().getTime();

  let revenueAllTimeCents = 0;
  let revenueThisMonthCents = 0;
  let revenueThisWeekCents = 0;
  let ordersActive = 0;
  let ordersAwaitingMe = 0;
  const pipeline: PipelineCounts = {
    awaiting_photos: 0,
    photos_received: 0,
    in_editing: 0,
    awaiting_approval: 0,
    revisions_requested: 0,
    delivered: 0,
  };

  for (const o of orders) {
    revenueAllTimeCents += o.price_cents;
    const t = new Date(o.created_at).getTime();
    if (t >= monthStart) revenueThisMonthCents += o.price_cents;
    if (t >= weekStart) revenueThisWeekCents += o.price_cents;
    pipeline[o.status] += 1;
    if (o.status !== "delivered") ordersActive += 1;
    if (
      o.status === "photos_received" ||
      o.status === "in_editing" ||
      o.status === "revisions_requested"
    ) {
      ordersAwaitingMe += 1;
    }
  }

  return {
    kpis: {
      revenueAllTimeCents,
      revenueThisMonthCents,
      revenueThisWeekCents,
      ordersAllTime: orders.length,
      ordersActive,
      ordersAwaitingMe,
    },
    pipeline,
    recentOrders: orders.slice(0, 5),
  };
}

export async function listCustomers(
  opts: { includeTest?: boolean } = {}
): Promise<CustomerSummary[]> {
  const supabase = supabaseAdmin();
  let q = supabase
    .from("orders")
    .select("customer_email, price_cents, created_at")
    .order("created_at", { ascending: false });
  if (!opts.includeTest) q = q.eq("livemode", true);
  const { data } = await q;
  const rows =
    (data as { customer_email: string; price_cents: number; created_at: string }[]) ?? [];

  const byEmail = new Map<string, CustomerSummary>();
  for (const r of rows) {
    const key = r.customer_email.toLowerCase();
    const existing = byEmail.get(key);
    if (!existing) {
      byEmail.set(key, {
        email: r.customer_email,
        orderCount: 1,
        totalSpentCents: r.price_cents,
        firstOrderAt: r.created_at,
        lastOrderAt: r.created_at,
      });
    } else {
      existing.orderCount += 1;
      existing.totalSpentCents += r.price_cents;
      if (r.created_at < existing.firstOrderAt) existing.firstOrderAt = r.created_at;
      if (r.created_at > existing.lastOrderAt) existing.lastOrderAt = r.created_at;
    }
  }

  return [...byEmail.values()].sort(
    (a, b) => b.totalSpentCents - a.totalSpentCents
  );
}

export type FinancialSummary = {
  monthly: { month: string; revenueCents: number; orderCount: number }[];
  byProduct: { slug: string; revenueCents: number; orderCount: number }[];
  byStatus: { status: OrderStatus; revenueCents: number; orderCount: number }[];
};

export async function getFinancialSummary(
  opts: { includeTest?: boolean } = {}
): Promise<FinancialSummary> {
  const supabase = supabaseAdmin();
  let q = supabase
    .from("orders")
    .select("price_cents, product_slug, status, created_at")
    .order("created_at", { ascending: false });
  if (!opts.includeTest) q = q.eq("livemode", true);
  const { data } = await q;
  const rows = (data ?? []) as {
    price_cents: number;
    product_slug: string;
    status: OrderStatus;
    created_at: string;
  }[];

  const monthlyMap = new Map<string, { revenueCents: number; orderCount: number }>();
  const productMap = new Map<string, { revenueCents: number; orderCount: number }>();
  const statusMap = new Map<OrderStatus, { revenueCents: number; orderCount: number }>();

  for (const r of rows) {
    const d = new Date(r.created_at);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const m = monthlyMap.get(monthKey) ?? { revenueCents: 0, orderCount: 0 };
    m.revenueCents += r.price_cents;
    m.orderCount += 1;
    monthlyMap.set(monthKey, m);

    const p = productMap.get(r.product_slug) ?? { revenueCents: 0, orderCount: 0 };
    p.revenueCents += r.price_cents;
    p.orderCount += 1;
    productMap.set(r.product_slug, p);

    const s = statusMap.get(r.status) ?? { revenueCents: 0, orderCount: 0 };
    s.revenueCents += r.price_cents;
    s.orderCount += 1;
    statusMap.set(r.status, s);
  }

  return {
    monthly: [...monthlyMap.entries()]
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([month, v]) => ({ month, ...v })),
    byProduct: [...productMap.entries()]
      .map(([slug, v]) => ({ slug, ...v }))
      .sort((a, b) => b.revenueCents - a.revenueCents),
    byStatus: [...statusMap.entries()]
      .map(([status, v]) => ({ status, ...v }))
      .sort((a, b) => b.revenueCents - a.revenueCents),
  };
}

export async function getRecentActivity(
  limit = 12,
  opts: { includeTest?: boolean } = {}
): Promise<ActivityItem[]> {
  const supabase = supabaseAdmin();
  // Orders themselves are the placement events.
  let orderQ = supabase
    .from("orders")
    .select("id, customer_email, created_at, price_cents")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!opts.includeTest) orderQ = orderQ.eq("livemode", true);
  const { data: orderRows } = await orderQ;
  // For per-video lifecycle events we use submitted_at + status to reconstruct.
  let videoQ = supabase
    .from("order_videos")
    .select(
      "order_id, video_index, status, submitted_at, revision_note, revision_count, orders!inner(livemode, customer_email)"
    )
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .limit(limit * 3);
  if (!opts.includeTest) videoQ = videoQ.eq("orders.livemode", true);
  const { data: videoRows } = await videoQ;

  const items: ActivityItem[] = [];

  for (const o of (orderRows ?? []) as {
    id: string;
    customer_email: string;
    created_at: string;
    price_cents: number;
  }[]) {
    items.push({
      id: `placed:${o.id}`,
      orderId: o.id,
      type: "order_placed",
      at: o.created_at,
      detail: `${o.customer_email} placed an order ($${(o.price_cents / 100).toFixed(2)})`,
    });
  }

  // Supabase types the joined `orders` as an array even for a single-row
  // !inner relation. Pull the first (only) row out, defensively.
  type VideoActivityRow = {
    order_id: string;
    video_index: number;
    status: OrderVideoStatus;
    submitted_at: string | null;
    revision_note: string | null;
    revision_count: number;
    orders: { customer_email: string }[] | { customer_email: string } | null;
  };
  for (const v of (videoRows ?? []) as unknown as VideoActivityRow[]) {
    const customerEmail = Array.isArray(v.orders)
      ? v.orders[0]?.customer_email
      : v.orders?.customer_email;
    if (!customerEmail) continue;
    if (v.status === "photos_received" && v.submitted_at) {
      items.push({
        id: `photos:${v.order_id}:${v.video_index}`,
        orderId: v.order_id,
        type: "photos_submitted",
        at: v.submitted_at,
        detail: `${customerEmail} submitted photos for video ${v.video_index}`,
      });
    }
    if (v.status === "delivered") {
      items.push({
        id: `delivered:${v.order_id}:${v.video_index}`,
        orderId: v.order_id,
        type: "delivered",
        at: v.submitted_at ?? new Date().toISOString(),
        detail: `Video ${v.video_index} delivered to ${customerEmail}`,
      });
    }
    if (v.status === "revisions_requested") {
      items.push({
        id: `revisions:${v.order_id}:${v.video_index}`,
        orderId: v.order_id,
        type: "revisions_requested",
        at: v.submitted_at ?? new Date().toISOString(),
        detail: `${customerEmail} requested revisions on video ${v.video_index} (#${v.revision_count})`,
      });
    }
  }

  return items.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, limit);
}
