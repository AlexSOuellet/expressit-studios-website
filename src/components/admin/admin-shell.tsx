"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListOrdered,
  DollarSign,
  Users,
  BarChart3,
  Trash2,
  ExternalLink,
} from "lucide-react";

// Sidebar shell wrapping every /admin/* page. The sidebar is sticky on
// desktop, collapses to a horizontal nav bar on mobile.

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  external?: boolean;
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ListOrdered },
  { href: "/admin/financial", label: "Financial", icon: DollarSign },
  { href: "/admin/customers", label: "Customers", icon: Users },
  {
    href: "https://vercel.com/alex-ouellet-s-projects/expressit-studios-website/analytics",
    label: "Analytics",
    icon: BarChart3,
    external: true,
  },
  { href: "/admin/wipe-test", label: "Wipe test data", icon: Trash2 },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-0">
      <aside className="md:w-60 md:shrink-0 md:border-r md:border-white/5 md:min-h-[calc(100vh-5rem)] md:sticky md:top-20">
        <nav className="p-4 md:p-6 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
          <p className="hidden md:block font-mono text-label-caps text-primary tracking-widest uppercase mb-3">
            Admin
          </p>
          {NAV.map((item) => {
            const Icon = item.icon;
            const active =
              !item.external &&
              (item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href));
            const className = `flex items-center gap-3 px-3 py-2 rounded-lg font-mono text-ui-mono uppercase tracking-wider whitespace-nowrap transition-colors ${
              active
                ? "bg-primary/15 text-primary"
                : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"
            }`;
            return item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className={className}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
                <ExternalLink className="h-3 w-3 ml-auto opacity-60" aria-hidden="true" />
              </a>
            ) : (
              <Link key={item.href} href={item.href} className={className}>
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
