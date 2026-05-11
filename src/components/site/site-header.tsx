import Link from "next/link";
import { Menu } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/business", label: "Business" },
  { href: "/personal", label: "Personal" },
  { href: "/process", label: "Process" },
  { href: "/blog", label: "Blog" },
] as const;

export function SiteHeader() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-surface/70 backdrop-blur-xl border-b border-white/10 shadow-[0_10px_30px_rgba(0,180,255,0.05)]">
      <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-4 max-w-full">
        <Link
          href="/"
          className="font-headline text-headline-sm text-primary tracking-tight"
        >
          EXPRESSIT STUDIOS
        </Link>

        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-12"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-ui-mono uppercase text-on-surface-variant hover:text-on-surface transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/products/custom-product-video-ad"
            className="hidden md:inline-flex primary-gradient text-on-primary-fixed font-mono text-ui-mono px-6 py-2 rounded-lg uppercase hover:opacity-90 transition-opacity"
          >
            Start Project
          </Link>

          {/* Mobile menu — native <details>, no JS */}
          <details className="md:hidden relative">
            <summary
              className="list-none cursor-pointer p-2 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-white/5"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </summary>
            <div className="absolute right-0 top-full mt-2 w-56 glass-card rounded-lg p-2 flex flex-col">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-mono text-ui-mono uppercase text-on-surface-variant hover:text-on-surface hover:bg-white/5 px-4 py-3 rounded-md"
                >
                  {link.label}
                </Link>
              ))}
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
