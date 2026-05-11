import Image from "next/image";
import Link from "next/link";

interface Track {
  trackNumber: string;
  href: string;
  title: string;
  description: string;
  image: { src: string; alt: string };
  accent: "primary" | "secondary";
  chips: string[];
}

const TRACKS: Track[] = [
  {
    trackNumber: "TRACK 01",
    href: "/business",
    title: "Business Ads",
    description:
      "High-performance motion graphics and video ads designed for scroll-stopping impact. Elevate your brand with cinematic precision.",
    image: {
      src: "/products/business/carousel-product.png",
      alt: "Cinematic product video ad",
    },
    accent: "secondary",
    chips: ["4K RAW", "COMMERCIAL"],
  },
  {
    trackNumber: "TRACK 02",
    href: "/personal",
    title: "Personal Memories",
    description:
      "Turn your photos into emotional short films. Pets, birthdays, gender reveals, anniversaries — preserve the moments that matter.",
    image: {
      src: "/products/personal/carousel-celebrations.png",
      alt: "Cinematic memory video for life moments",
    },
    accent: "primary",
    chips: ["EMOTIVE", "LIFETIME"],
  },
];

export function Tracks() {
  return (
    <section className="px-margin-mobile md:px-margin-desktop py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter max-w-7xl mx-auto">
        {TRACKS.map((track) => (
          <Link
            key={track.href}
            href={track.href}
            className="glass-card glow-shadow rounded-xl transition-all duration-500 group relative overflow-hidden h-[500px] flex flex-col justify-end p-12"
          >
            <div className="absolute inset-0 -z-10 opacity-30 group-hover:opacity-50 transition-opacity duration-700">
              <Image
                src={track.image.src}
                alt={track.image.alt}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover grayscale group-hover:grayscale-0 transition-all"
              />
            </div>
            <div className="relative z-10">
              <span
                className={`font-mono text-label-caps mb-2 block uppercase tracking-widest ${
                  track.accent === "primary" ? "text-primary" : "text-secondary"
                }`}
              >
                {track.trackNumber}
              </span>
              <h3 className="font-headline text-headline-xl text-on-surface mb-4">
                {track.title}
              </h3>
              <p className="font-body text-body-md text-on-surface-variant mb-6 max-w-sm">
                {track.description}
              </p>
              <div className="flex gap-1">
                {track.chips.map((chip) => (
                  <span
                    key={chip}
                    className="bg-surface-container-highest font-mono text-label-caps px-4 py-1 rounded-full uppercase tracking-widest"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
