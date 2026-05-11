import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/refund", label: "Refund Policy" },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full py-12 border-t border-white/5 bg-surface-container-lowest">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter px-margin-mobile md:px-margin-desktop items-center">
        <Link
          href="/"
          className="font-headline text-headline-md text-on-surface order-2 md:order-1 text-center md:text-left"
        >
          EXPRESSIT STUDIOS
        </Link>

        <p className="font-mono text-label-caps text-outline order-1 md:order-2 text-center uppercase tracking-widest">
          © {year} EXPRESSIT STUDIOS · THE ART OF MOTION
        </p>

        <div className="flex justify-center md:justify-end gap-6 order-3">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-label-caps uppercase tracking-widest text-outline hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
