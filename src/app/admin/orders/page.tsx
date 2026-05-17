import type { Metadata } from "next";
import Link from "next/link";
import { listAllOrders, resolveAdminViewMode } from "@/lib/admin";
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

  return (
    <main className="flex-1 px-margin-mobile md:px-margin-desktop py-16">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10">
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
          <ul className="space-y-3">
            {orders.map((o) => {
              const deliveredCount = o.videos.filter(
                (v) => v.status === "delivered"
              ).length;
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
                    <span className="font-mono text-ui-mono uppercase tracking-widest text-secondary min-w-[10rem]">
                      {STATUS_LABEL[o.status]}
                      <span className="text-outline">
                        {" "}
                        ({deliveredCount}/{o.videos.length})
                      </span>
                    </span>
                    <span className="font-body text-body-sm text-outline w-full sm:w-auto">
                      {formatDate(o.created_at)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
