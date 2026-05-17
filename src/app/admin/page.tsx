import type { Metadata } from "next";
import Link from "next/link";
import {
  getDashboardData,
  getRecentActivity,
  type PipelineCounts,
} from "@/lib/admin";
import { formatPrice } from "@/lib/products";
import type { OrderStatus } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Admin — Dashboard",
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

// Pipeline columns in the order an order moves through them.
const PIPELINE_ORDER: OrderStatus[] = [
  "awaiting_photos",
  "photos_received",
  "in_editing",
  "awaiting_approval",
  "revisions_requested",
  "delivered",
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function Kpi({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="glass-card rounded-xl p-5">
      <p className="font-mono text-label-caps text-on-surface-variant uppercase tracking-widest mb-2">
        {label}
      </p>
      <p className="font-display text-headline-lg text-on-surface leading-none">
        {value}
      </p>
      {sub && (
        <p className="font-body text-body-sm text-outline mt-2">{sub}</p>
      )}
    </div>
  );
}

function PipelineCol({
  status,
  count,
}: {
  status: OrderStatus;
  count: number;
}) {
  return (
    <div className="glass-card rounded-xl p-4">
      <p className="font-mono text-ui-mono uppercase tracking-widest text-on-surface-variant mb-2">
        {STATUS_LABEL[status]}
      </p>
      <p className="font-display text-headline-md text-on-surface leading-none">
        {count}
      </p>
    </div>
  );
}

type SearchParams = Promise<{ test?: string }>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { test } = await searchParams;
  const includeTest = test === "1";
  const [{ kpis, pipeline, recentOrders }, activity] = await Promise.all([
    getDashboardData({ includeTest }),
    getRecentActivity(8, { includeTest }),
  ]);

  const emptyState = kpis.ordersAllTime === 0;

  return (
    <main className="px-margin-mobile md:px-margin-desktop py-12">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <span className="font-mono text-label-caps text-primary tracking-widest uppercase block mb-3">
            Overview
          </span>
          <h1 className="font-display text-headline-xl text-on-surface mb-2">
            Dashboard
          </h1>
          <p className="font-body text-body-md text-on-surface-variant">
            {includeTest
              ? "Including test (seeded + Stripe-test) orders."
              : "Live-mode data only."}{" "}
            <Link
              href={includeTest ? "/admin" : "/admin?test=1"}
              className="underline text-primary"
            >
              {includeTest ? "Hide test data" : "Show test data"}
            </Link>
          </p>
        </header>

        {emptyState ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <p className="font-body text-body-lg text-on-surface mb-2">
              No live orders yet.
            </p>
            <p className="font-body text-body-md text-on-surface-variant">
              Dashboard numbers will populate the moment a real Stripe payment
              comes in. In the meantime, the navigation works — explore Orders,
              Financial, Customers, or open the Analytics tab.
            </p>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
              <Kpi
                label="This week"
                value={formatPrice(kpis.revenueThisWeekCents)}
              />
              <Kpi
                label="This month"
                value={formatPrice(kpis.revenueThisMonthCents)}
              />
              <Kpi
                label="All time"
                value={formatPrice(kpis.revenueAllTimeCents)}
                sub={`${kpis.ordersAllTime} order${kpis.ordersAllTime === 1 ? "" : "s"}`}
              />
              <Kpi
                label="Awaiting you"
                value={`${kpis.ordersAwaitingMe}`}
                sub={`${kpis.ordersActive} active total`}
              />
            </section>

            {/* Pipeline */}
            <section className="mb-10">
              <h2 className="font-mono text-label-caps text-primary uppercase tracking-widest mb-3">
                Pipeline
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {PIPELINE_ORDER.map((s) => (
                  <PipelineCol
                    key={s}
                    status={s}
                    count={(pipeline as PipelineCounts)[s]}
                  />
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent orders */}
              <section className="lg:col-span-2">
                <div className="flex items-baseline justify-between mb-3">
                  <h2 className="font-mono text-label-caps text-primary uppercase tracking-widest">
                    Recent orders
                  </h2>
                  <Link
                    href={includeTest ? "/admin/orders?test=1" : "/admin/orders"}
                    className="font-mono text-ui-mono uppercase tracking-widest text-primary hover:underline"
                  >
                    All orders →
                  </Link>
                </div>
                {recentOrders.length === 0 ? (
                  <p className="font-body text-body-md text-on-surface-variant">
                    Nothing yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {recentOrders.map((o) => (
                      <li key={o.id}>
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="glass-card rounded-lg p-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 hover:border-primary transition block"
                        >
                          <span className="font-mono text-ui-mono uppercase tracking-wider text-on-surface">
                            #{o.id.slice(0, 8)}
                          </span>
                          <span className="font-body text-body-sm text-on-surface-variant flex-1 min-w-[10rem] truncate">
                            {o.customer_email}
                          </span>
                          <span className="font-body text-body-sm text-on-surface">
                            {formatPrice(o.price_cents)}
                          </span>
                          <span className="font-mono text-ui-mono uppercase tracking-widest text-secondary">
                            {STATUS_LABEL[o.status]}
                          </span>
                          <span className="font-body text-body-sm text-outline">
                            {timeAgo(o.created_at)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Recent activity */}
              <section>
                <h2 className="font-mono text-label-caps text-primary uppercase tracking-widest mb-3">
                  Recent activity
                </h2>
                {activity.length === 0 ? (
                  <p className="font-body text-body-md text-on-surface-variant">
                    Quiet for now.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {activity.map((a) => (
                      <li key={a.id} className="border-l-2 border-outline pl-3">
                        <Link
                          href={`/admin/orders/${a.orderId}`}
                          className="block hover:text-primary transition-colors"
                        >
                          <p className="font-body text-body-sm text-on-surface">
                            {a.detail}
                          </p>
                          <p className="font-mono text-ui-mono uppercase tracking-widest text-outline mt-1">
                            {timeAgo(a.at)}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
