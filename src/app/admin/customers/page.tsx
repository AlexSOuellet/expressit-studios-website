import type { Metadata } from "next";
import { listCustomers } from "@/lib/admin";
import { formatPrice } from "@/lib/products";

export const metadata: Metadata = {
  title: "Admin — Customers",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function CustomersPage() {
  const customers = await listCustomers();

  return (
    <main className="px-margin-mobile md:px-margin-desktop py-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <span className="font-mono text-label-caps text-primary tracking-widest uppercase block mb-3">
            People
          </span>
          <h1 className="font-display text-headline-xl text-on-surface mb-2">
            Customers
          </h1>
          <p className="font-body text-body-md text-on-surface-variant">
            {customers.length}{" "}
            {customers.length === 1 ? "customer" : "customers"} with live
            orders, sorted by total spent.
          </p>
        </header>

        {customers.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <p className="font-body text-body-lg text-on-surface mb-2">
              No customers yet.
            </p>
            <p className="font-body text-body-md text-on-surface-variant">
              This list builds itself as live orders come in. Customers are
              grouped by email address.
            </p>
          </div>
        ) : (
          <div className="glass-card rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 font-mono text-ui-mono uppercase tracking-widest text-on-surface-variant">
                    Email
                  </th>
                  <th className="px-4 py-3 font-mono text-ui-mono uppercase tracking-widest text-on-surface-variant text-right">
                    Orders
                  </th>
                  <th className="px-4 py-3 font-mono text-ui-mono uppercase tracking-widest text-on-surface-variant text-right">
                    Total spent
                  </th>
                  <th className="px-4 py-3 font-mono text-ui-mono uppercase tracking-widest text-on-surface-variant text-right">
                    First
                  </th>
                  <th className="px-4 py-3 font-mono text-ui-mono uppercase tracking-widest text-on-surface-variant text-right">
                    Last
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.email} className="border-t border-white/5">
                    <td className="px-4 py-3 font-body text-body-md text-on-surface break-all">
                      {c.email}
                    </td>
                    <td className="px-4 py-3 font-body text-body-md text-on-surface-variant text-right">
                      {c.orderCount}
                    </td>
                    <td className="px-4 py-3 font-body text-body-md text-on-surface text-right">
                      {formatPrice(c.totalSpentCents)}
                    </td>
                    <td className="px-4 py-3 font-body text-body-sm text-outline text-right">
                      {formatDate(c.firstOrderAt)}
                    </td>
                    <td className="px-4 py-3 font-body text-body-sm text-outline text-right">
                      {formatDate(c.lastOrderAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
