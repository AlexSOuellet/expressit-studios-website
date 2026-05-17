import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import {
  listCustomers,
  resolveAdminViewMode,
  type CustomerSortKey,
  type SortDir,
} from "@/lib/admin";
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

type SearchParams = Promise<{
  test?: string;
  sort?: string;
  dir?: string;
}>;

const VALID_SORTS: CustomerSortKey[] = [
  "lastOrder",
  "firstOrder",
  "spent",
  "orders",
  "email",
];

function parseSort(s: string | undefined): CustomerSortKey {
  return VALID_SORTS.includes(s as CustomerSortKey)
    ? (s as CustomerSortKey)
    : "lastOrder";
}

function parseDir(d: string | undefined): SortDir {
  return d === "asc" ? "asc" : "desc";
}

function SortHeader({
  label,
  field,
  currentSort,
  currentDir,
  test,
  align = "left",
}: {
  label: string;
  field: CustomerSortKey;
  currentSort: CustomerSortKey;
  currentDir: SortDir;
  test: string | undefined;
  align?: "left" | "right";
}) {
  const isActive = currentSort === field;
  const nextDir: SortDir = isActive && currentDir === "desc" ? "asc" : "desc";
  const params = new URLSearchParams();
  params.set("sort", field);
  params.set("dir", nextDir);
  if (test === "1") params.set("test", "1");
  if (test === "0") params.set("test", "0");

  const Icon = !isActive ? ArrowUpDown : currentDir === "desc" ? ArrowDown : ArrowUp;

  return (
    <th
      className={`px-4 py-3 font-mono text-ui-mono uppercase tracking-widest text-on-surface-variant ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      <Link
        href={`/admin/customers?${params.toString()}`}
        className={`inline-flex items-center gap-1.5 hover:text-on-surface transition-colors ${
          isActive ? "text-primary" : ""
        }`}
      >
        <span>{label}</span>
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </th>
  );
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { test, sort: sortParam, dir: dirParam } = await searchParams;
  const { includeTest, autoPromotedToTest } = await resolveAdminViewMode(test);
  const sort = parseSort(sortParam);
  const dir = parseDir(dirParam);
  const customers = await listCustomers({ includeTest, sort, dir });

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
            {autoPromotedToTest
              ? "No live customers yet — showing test data. "
              : ""}
            {customers.length}{" "}
            {customers.length === 1 ? "customer" : "customers"} with{" "}
            {includeTest ? "any" : "live"} orders. Click a column header to
            sort.{" "}
            <Link
              href={
                includeTest ? "/admin/customers?test=0" : "/admin/customers?test=1"
              }
              className="underline text-primary"
            >
              {includeTest ? "Hide test data" : "Show test data"}
            </Link>
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
                  <SortHeader
                    label="Email"
                    field="email"
                    currentSort={sort}
                    currentDir={dir}
                    test={test}
                  />
                  <SortHeader
                    label="Orders"
                    field="orders"
                    currentSort={sort}
                    currentDir={dir}
                    test={test}
                    align="right"
                  />
                  <SortHeader
                    label="Total spent"
                    field="spent"
                    currentSort={sort}
                    currentDir={dir}
                    test={test}
                    align="right"
                  />
                  <SortHeader
                    label="First"
                    field="firstOrder"
                    currentSort={sort}
                    currentDir={dir}
                    test={test}
                    align="right"
                  />
                  <SortHeader
                    label="Last"
                    field="lastOrder"
                    currentSort={sort}
                    currentDir={dir}
                    test={test}
                    align="right"
                  />
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
