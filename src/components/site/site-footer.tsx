import Link from "next/link";
import {
  FacebookIcon,
  YoutubeIcon,
  InstagramIcon,
  TikTokIcon,
  LinkedInIcon,
} from "./brand-icons";

const FOOTER_LINKS = [
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/refund", label: "Refund Policy" },
] as const;

// Add a new social profile by appending here. Commented entries show what's
// queued for when Alex adds the handle.
const SOCIALS = [
  {
    label: "YouTube",
    href: "https://www.youtube.com/@ExpressItStudios",
    Icon: YoutubeIcon,
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/ExpressItStudios",
    Icon: FacebookIcon,
  },
  // { label: "Instagram", href: "https://www.instagram.com/…", Icon: InstagramIcon },
  // { label: "TikTok",    href: "https://www.tiktok.com/@…",   Icon: TikTokIcon  },
  // { label: "LinkedIn",  href: "https://www.linkedin.com/…",  Icon: LinkedInIcon },
] as const;

// Touch the unused icons so eslint/tsc don't gripe before we wire them up.
void InstagramIcon;
void TikTokIcon;
void LinkedInIcon;

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full py-12 border-t border-white/5 bg-surface-container-lowest">
      <div className="max-w-6xl mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter items-center mb-6">
          <Link
            href="/"
            className="font-headline text-headline-md text-on-surface order-2 md:order-1 text-center md:text-left"
          >
            EXPRESSIT STUDIOS
          </Link>

          <p className="font-mono text-label-caps text-outline order-1 md:order-2 text-center uppercase tracking-widest">
            © {year} EXPRESSIT STUDIOS
          </p>

          <div className="flex justify-center md:justify-end gap-3 order-3">
            {SOCIALS.map(({ label, href, Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="p-2 rounded-md text-outline hover:text-primary hover:bg-white/5 transition-colors"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 pt-4 border-t border-white/5">
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
