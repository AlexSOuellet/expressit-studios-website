import Image from "next/image";
import Link from "next/link";

interface Track {
  href: string;
  title: string;
  description: string;
  image: { src: string; alt: string };
  accent: "primary" | "secondary";
  chips: string[];
  cta: string;
}

const TRACKS: Track[] = [
  {
    href: "/business",
    title: "Business Ads",
    description:
      "High-performance motion graphics built for scroll-stopping product ads. From single videos to 3-video campaigns",
    image: {
      src: "/tracks/business.png",
      alt: "Cinematic product video ad",
    },
    accent: "secondary",
    chips: ["4K", "Commercial", "From $35"],
    cta: "Shop Business →",
  },
  {
    href: "/personal",
    title: "Personal Memories",
    description:
      "Turn your photos into emotional short films. Pets, birthdays, anniversaries, gender reveals, weddings",
    image: {
      src: "/tracks/personal.png",
      alt: "Cinematic memory video for life moments",
    },
    accent: "primary",
    chips: ["Emotive", "15 sec", "$24.99"],
    cta: "Shop Personal →",
  },
];

export function Tracks() {
  return (
    <section className="px-margin-mobile md:px-margin-desktop py-24 relative overflow-hidden">
      <div className="text-center mb-12 max-w-3xl mx-auto">
        <h2 className="font-display text-headline-xl md:text-display-lg text-on-surface leading-none">
          Two paths{" "}
          <span className="italic text-primary inline-block pr-[0.1em]">
            One
          </span>{" "}
          studio
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter max-w-7xl mx-auto">
        {TRACKS.map((track) => {
          const accentColor =
            track.accent === "primary" ? "text-primary" : "text-secondary";
          const accentGlow =
            track.accent === "primary"
              ? "group-hover:shadow-[0_20px_60px_rgba(0,180,255,0.25)]"
              : "group-hover:shadow-[0_20px_60px_rgba(0,229,160,0.25)]";

          return (
            <Link
              key={track.href}
              href={track.href}
              className={`glass-card rounded-xl transition-all duration-500 group relative overflow-hidden h-[520px] flex flex-col justify-end p-12 hover:-translate-y-1 ${accentGlow}`}
            >
              <div className="absolute inset-0 -z-10 opacity-70 group-hover:opacity-100 transition-opacity duration-700">
                <Image
                  src={track.image.src}
                  alt={track.image.alt}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
              </div>

              <div className="relative z-10">
                <h3 className="font-headline text-headline-xl text-on-surface mb-4">
                  {track.title}
                </h3>
                <p className="font-body text-body-md text-on-surface-variant mb-6 max-w-[24rem]">
                  {track.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {track.chips.map((chip) => (
                    <span
                      key={chip}
                      className="bg-surface-container-highest/80 backdrop-blur font-mono text-label-caps px-3 py-1.5 rounded-full uppercase tracking-widest border border-white/10"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
                <span
                  className={`font-mono text-ui-mono uppercase tracking-widest ${accentColor} group-hover:translate-x-1 inline-block transition-transform`}
                >
                  {track.cta}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
