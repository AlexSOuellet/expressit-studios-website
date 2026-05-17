import type { Metadata } from "next";
import Link from "next/link";
import { listAllOrders, resolveAdminViewMode, type AdminOrderListItem } from "@/lib/admin";
import { getProductBySlug, formatPrice } from "@/lib/products";
import type { OrderStatus } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Admin — Orders",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<OrderStatus, string> = {
  awaiting_photos: "Awaiting photos",
  photos_received: "Photos received",
  in_editing: "In editing",
  awaiting_approval: "Awaiting approval",
  revisions_requested: "Revisions requested",
  delivered: "Delivered",
};

// Group orders by what action they need so the most-actionable ones are
// at the top and finished work is hidden by default.
const NEEDS_ATTENTION: ReadonlySet<OrderStatus> = new Set([
  "photos_received",
  "in_editing",
  "revisions_requested",
]);
const WAITING_ON_CUSTOMER: ReadonlySet<OrderStatus> = new Set([
  "awaiting_photos",
  "awaiting_approval",
]);

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type SearchParams = Promise<{ test?: string }>;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { test } = await searchParams;
  const { includeTest, autoPromotedToTest } = await resolveAdminViewMode(test);
  const orders = await listAllOrders({ includeTest });

  // Resolve product titles once.
  const slugs = [...new Set(orders.map((o) => o.product_slug))];
  const titleBySlug = new Map<string, string>();
  await Promise.all(
    slugs.map(async (slug) => {
      const p = await getProductBySlug(slug);
      if (p) titleBySlug.set(slug, p.title);
    })
  );

  const needsAttention = orders.filter((o) => NEEDS_ATTENTION.has(o.status));
  const waitingOnCustomer = orders.filter((o) =>
    WAITING_ON_CUSTOMER.has(o.status)
  );
  const delivered = orders.filter((o) => o.status === "delivered");

  return (
    <main className="px-margin-mobile md:px-margin-desktop py-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <span className="font-mono text-label-caps text-primary tracking-widest uppercase block mb-3">
            Admin
          </span>
          <h1 className="font-display text-headline-xl text-on-surface mb-2">
            Orders
          </h1>
          <p className="font-body text-body-md text-on-surface-variant">
            {autoPromotedToTest && "No live orders yet — showing test. "}
            {orders.length} {orders.length === 1 ? "order" : "orders"}{" "}
            {includeTest ? "total (live + test)" : "live"}.{" "}
            <Link
              href={includeTest ? "/admin/orders?test=0" : "/admin/orders?test=1"}
              className="underline text-primary"
            >
              {includeTest ? "Hide test orders" : "Show test orders"}
            </Link>
            {" · "}
            <Link href="/admin/wipe-test" className="underline text-primary">
              Wipe test data
            </Link>
          </p>
        </header>

        {orders.length === 0 ? (
          <p className="font-body text-body-md text-on-surface-variant">
            No orders yet.
          </p>
        ) : (
          <>
            <OrderBucket
              title="Needs your attention"
              orders={needsAttention}
              titleBySlug={titleBySlug}
              accent="text-primary"
              emptyText="Inbox zero — nothing for you to action right now."
            />
            <OrderBucket
              title="Waiting on customer"
              orders={waitingOnCustomer}
              titleBySlug={titleBySlug}
              accent="text-secondary"
              emptyText="No orders sitting on a customer."
            />

            {delivered.length > 0 && (
              <details className="mt-10">
                <summary className="cursor-pointer font-mono text-label-caps text-outline uppercase tracking-widest hover:text-on-surface-variant transition-colors">
                  Delivered ({delivered.length}) — click to show
                </summary>
                <div className="mt-4">
                  <OrderList
                    orders={delivered}
                    titleBySlug={titleBySlug}
                  />
                </div>
              </details>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function OrderBucket({
  title,
  orders,
  titleBySlug,
  accent,
  emptyText,
}: {
  title: string;
  orders: AdminOrderListItem[];
  titleBySlug: Map<string, string>;
  accent: string;
  emptyText: string;
}) {
  return (
    <section className="mb-10">
      <div className="flex items-baseline justify-between mb-3">
        <h2
          className={`font-mono text-label-caps uppercase tracking-widest ${accent}`}
        >
          {title}
        </h2>
        <span className="font-mono text-ui-mono uppercase tracking-widest text-outline">
          {orders.length}
        </span>
      </div>
      {orders.length === 0 ? (
        <p className="font-body text-body-sm text-outline">{emptyText}</p>
      ) : (
        <OrderList orders={orders} titleBySlug={titleBySlug} />
      )}
    </section>
  );
}

// Compact, color-coded status chips per video — one square per video, color
// = where that video is in the pipeline. Replaces the misleading rollup
// "PHOTOS RECEIVED (0/3)" badge for bundles.
const VIDEO_STATUS_STYLE: Record<OrderStatus, { color: string; short: string }> = {
  awaiting_photos:     { color: "bg-amber-400/20 text-amber-300 border-amber-400/40", short: "Photos?" },
  photos_received:     { color: "bg-blue-400/20 text-blue-300 border-blue-400/40",   short: "Photos in" },
  in_editing:          { color: "bg-purple-400/20 text-purple-300 border-purple-400/40", short: "Editing" },
  awaiting_approval:   { color: "bg-cyan-400/20 text-cyan-300 border-cyan-400/40",   short: "Review" },
  revisions_requested: { color: "bg-rose-400/20 text-rose-300 border-rose-400/40",   short: "Revisions" },
  delivered:           { color: "bg-emerald-400/20 text-emerald-300 border-emerald-400/40", short: "Done" },
};

function OrderList({
  orders,
  titleBySlug,
}: {
  orders: AdminOrderListItem[];
  titleBySlug: Map<string, string>;
}) {
  return (
    <ul className="space-y-3">
      {orders.map((o) => {
        const sortedVideos = [...o.videos].sort(
          (a, b) => a.video_index - b.video_index
        );
        const isBundle = sortedVideos.length > 1;
        return (
          <li key={o.id}>
            <Link
              href={`/admin/orders/${o.id}`}
              className="glass-card rounded-xl p-5 flex flex-wrap items-center gap-x-6 gap-y-2 hover:border-primary transition block"
            >
              <span className="font-mono text-ui-mono uppercase tracking-wider text-on-surface">
                #{o.id.slice(0, 8)}
                {!o.livemode && (
                  <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-amber-200 text-amber-900 align-middle">
                    TEST
                  </span>
                )}
              </span>
              <span className="font-body text-body-md text-on-surface flex-1 min-w-[12rem]">
                {titleBySlug.get(o.product_slug) ?? o.product_slug}
                <span className="text-on-surface-variant">
                  {" · "}
                  {o.variant_id}
                </span>
              </span>
              <span className="font-body text-body-sm text-on-surface-variant min-w-[14rem]">
                {o.customer_email}
              </span>
              <span className="font-body text-body-sm text-on-surface">
                {formatPrice(o.price_cents)}
              </span>
              <span className="flex flex-wrap items-center gap-1.5 min-w-[10rem]">
                {sortedVideos.map((v) => {
                  const s = VIDEO_STATUS_STYLE[v.status as OrderStatus];
                  return (
                    <span
                      key={v.video_index}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border font-mono text-[10px] uppercase tracking-wider ${s.color}`}
                      title={`Video ${v.video_index}: ${STATUS_LABEL[v.status as OrderStatus]}`}
                    >
                      {isBundle && (
                        <span className="opacity-60">V{v.video_index}</span>
                      )}
                      {s.short}
                    </span>
                  );
                })}
              </span>
              <span className="font-body text-body-sm text-outline w-full sm:w-auto">
                {formatDate(o.created_at)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
