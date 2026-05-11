"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/business", label: "Business" },
  { href: "/personal", label: "Personal" },
  { href: "/process", label: "Process" },
  { href: "/blog", label: "Blog" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname() ?? "/";

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-surface-container-lowest/95 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      <div className="flex items-center px-margin-mobile md:px-margin-desktop py-4 max-w-full">
        {/* Left: wordmark */}
        <Link
          href="/"
          className="font-headline text-headline-sm text-on-surface tracking-tight shrink-0"
        >
          EXPRESSIT STUDIOS
        </Link>

        {/* Center: nav (desktop) */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-12 mx-auto"
        >
          {NAV_LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`font-mono text-ui-mono uppercase transition-colors pb-1 ${
                  active
                    ? "text-primary border-b-2 border-primary font-bold"
                    : "text-on-surface-variant hover:text-on-surface border-b-2 border-transparent"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: CTA + mobile menu */}
        <div className="flex items-center gap-4 shrink-0 ml-auto md:ml-0">
          <Link
            href="/products/custom-product-video-ad"
            className="hidden md:inline-flex primary-gradient text-on-primary-fixed font-mono text-ui-mono px-6 py-2 rounded-lg uppercase hover:opacity-90 transition-opacity"
          >
            Start Project
          </Link>

          <details className="md:hidden relative">
            <summary
              className="list-none cursor-pointer p-2 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-white/5"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </summary>
            <div className="absolute right-0 top-full mt-2 w-56 glass-card rounded-lg p-2 flex flex-col">
              {NAV_LINKS.map((link) => {
                const active = isActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`font-mono text-ui-mono uppercase hover:bg-white/5 px-4 py-3 rounded-md ${
                      active ? "text-primary" : "text-on-surface-variant"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <Link
                href="/products/custom-product-video-ad"
                className="primary-gradient text-on-primary-fixed font-mono text-ui-mono px-4 py-3 rounded-md uppercase mt-2 text-center"
              >
                Start Project
              </Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
