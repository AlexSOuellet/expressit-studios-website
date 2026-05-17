import type { Metadata } from "next";
import { getFinancialSummary } from "@/lib/admin";
import { getProductBySlug, formatPrice } from "@/lib/products";
import type { OrderStatus } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Admin — Financial",
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

function formatMonth(key: string): string {
  // key = "YYYY-MM"
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default async function FinancialPage() {
  const { monthly, byProduct, byStatus } = await getFinancialSummary();

  const titleBySlug = new Map<string, string>();
  await Promise.all(
    byProduct.map(async (p) => {
      const prod = await getProductBySlug(p.slug);
      if (prod) titleBySlug.set(p.slug, prod.title);
    })
  );

  const allTime = monthly.reduce((acc, m) => acc + m.revenueCents, 0);
  const allTimeCount = monthly.reduce((acc, m) => acc + m.orderCount, 0);

  return (
    <main className="px-margin-mobile md:px-margin-desktop py-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <span className="font-mono text-label-caps text-primary tracking-widest uppercase block mb-3">
            Money
          </span>
          <h1 className="font-display text-headline-xl text-on-surface mb-2">
            Financial
          </h1>
          <p className="font-body text-body-md text-on-surface-variant">
            Gross revenue from live Stripe orders. Does not subtract Stripe
            fees (~2.9% + $0.30 per charge) — for the net view open the Stripe
            dashboard directly.
          </p>
        </header>

        {allTimeCount === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <p className="font-body text-body-lg text-on-surface mb-2">
              No live revenue yet.
            </p>
            <p className="font-body text-body-md text-on-surface-variant">
              Once Stripe live mode is active and a real customer pays, this
              page will populate by month, product, and status.
            </p>
          </div>
        ) : (
          <>
            <section className="glass-card rounded-xl p-5 mb-8">
              <p className="font-mono text-label-caps text-on-surface-variant uppercase tracking-widest mb-2">
                Gross all-time
              </p>
              <p className="font-display text-headline-xl text-on-surface leading-none">
                {formatPrice(allTime)}
              </p>
              <p className="font-body text-body-sm text-outline mt-2">
                Across {allTimeCount} order{allTimeCount === 1 ? "" : "s"}.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="font-mono text-label-caps text-primary uppercase tracking-widest mb-3">
                By month
              </h2>
              <div className="glass-card rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 font-mono text-ui-mono uppercase tracking-widest text-on-surface-variant">
                        Month
                      </th>
                      <th className="px-4 py-3 font-mono text-ui-mono uppercase tracking-widest text-on-surface-variant text-right">
                        Orders
                      </th>
                      <th className="px-4 py-3 font-mono text-ui-mono uppercase tracking-widest text-on-surface-variant text-right">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthly.map((m) => (
                      <tr key={m.month} className="border-t border-white/5">
                        <td className="px-4 py-3 font-body text-body-md text-on-surface">
                          {formatMonth(m.month)}
                        </td>
                        <td className="px-4 py-3 font-body text-body-md text-on-surface-variant text-right">
                          {m.orderCount}
                        </td>
                        <td className="px-4 py-3 font-body text-body-md text-on-surface text-right">
                          {formatPrice(m.revenueCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section>
                <h2 className="font-mono text-label-caps text-primary uppercase tracking-widest mb-3">
                  By product
                </h2>
                <ul className="space-y-2">
                  {byProduct.map((p) => (
                    <li
                      key={p.slug}
                      className="glass-card rounded-lg p-4 flex items-baseline justify-between"
                    >
                      <span className="font-body text-body-md text-on-surface">
                        {titleBySlug.get(p.slug) ?? p.slug}
                        <span className="text-outline font-body text-body-sm">
                          {" "}
                          · {p.orderCount}
                        </span>
                      </span>
                      <span className="font-body text-body-md text-on-surface">
                        {formatPrice(p.revenueCents)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="font-mono text-label-caps text-primary uppercase tracking-widest mb-3">
                  By status
                </h2>
                <ul className="space-y-2">
                  {byStatus.map((s) => (
                    <li
                      key={s.status}
                      className="glass-card rounded-lg p-4 flex items-baseline justify-between"
                    >
                      <span className="font-body text-body-md text-on-surface">
                        {STATUS_LABEL[s.status]}
                        <span className="text-outline font-body text-body-sm">
                          {" "}
                          · {s.orderCount}
                        </span>
                      </span>
                      <span className="font-body text-body-md text-on-surface">
                        {formatPrice(s.revenueCents)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
