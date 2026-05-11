import type { Metadata } from "next";
import Image from "next/image";
import { getProductsByCategory } from "@/lib/products";
import { ProductCard } from "@/components/product/product-card";

export const metadata: Metadata = {
  title: "Personal — Cinematic Memory Videos",
  description:
    "Custom memory videos from your photos. Pets, birthdays, gender reveals, anniversaries — your moment, brought to motion.",
};

const SAMPLES = [
  { src: "/samples/personal/birthday.mp4", label: "Birthday" },
  { src: "/samples/personal/pet.mp4", label: "Pet" },
  { src: "/samples/personal/gender-reveal.mp4", label: "Gender Reveal" },
];

const OCCASIONS = [
  { src: "/examples/personal/birthday.jpg", alt: "Birthday memory video example", label: "Birthdays" },
  { src: "/examples/personal/gender-reveal.jpg", alt: "Gender reveal memory video example", label: "Gender Reveals" },
  { src: "/examples/personal/memorial.jpg", alt: "Pet memorial video example", label: "Memorials" },
  { src: "/examples/personal/new-pup.jpg", alt: "New pet welcome video", label: "New Additions" },
  { src: "/examples/personal/celebrations.png", alt: "Celebrations video collage", label: "Celebrations" },
  { src: "/examples/personal/pet-tribute.png", alt: "Pet tribute final frame", label: "Pet Tributes" },
];

const BEFORE_AFTERS = [
  { src: "/examples/personal/before-after-1.jpg", alt: "Before / after — memory 1" },
  { src: "/examples/personal/before-after-2.jpg", alt: "Before / after — memory 2" },
  { src: "/examples/personal/before-after-3.jpg", alt: "Before / after — memory 3" },
  { src: "/examples/personal/before-after-4.jpg", alt: "Before / after — memory 4" },
];

export default async function PersonalPage() {
  const products = await getProductsByCategory("personal");

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-12">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/hero/personal.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-40"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/60" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto text-center px-margin-mobile md:px-margin-desktop py-24">
          <span className="font-mono text-label-caps text-primary tracking-widest uppercase block mb-4">
            Track 02 — Personal
          </span>
          <h1 className="font-display text-[48px] md:text-headline-xl lg:text-display-lg text-on-surface leading-none mb-6">
            Cinematic Memory Videos
          </h1>
          <p className="font-body text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            Turn the photos that matter into a cinematic short film. Pets,
            birthdays, weddings, memorials — every moment deserves motion.
          </p>
        </div>
      </section>

      {/* Recent work — video reels */}
      <section className="px-margin-mobile md:px-margin-desktop py-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <span className="font-mono text-label-caps text-primary tracking-widest uppercase block mb-3">
              Recent Work
            </span>
            <h2 className="font-display text-headline-xl text-on-surface leading-none">
              Sample memories
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {SAMPLES.map((sample) => (
              <figure
                key={sample.src}
                className="glass-card rounded-xl overflow-hidden"
              >
                <video
                  src={sample.src}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className="w-full aspect-[9/16] object-cover bg-surface-container-lowest"
                />
                <figcaption className="font-mono text-label-caps text-on-surface-variant uppercase tracking-widest px-4 py-3 border-t border-white/5">
                  {sample.label}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Occasions grid */}
      <section className="px-margin-mobile md:px-margin-desktop pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <span className="font-mono text-label-caps text-primary tracking-widest uppercase block mb-3">
              Every Moment
            </span>
            <h2 className="font-display text-headline-xl text-on-surface leading-none">
              Occasions we film
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-gutter">
            {OCCASIONS.map((occ) => (
              <figure
                key={occ.src}
                className="relative aspect-square overflow-hidden rounded-xl glass-card group"
              >
                <Image
                  src={occ.src}
                  alt={occ.alt}
                  fill
                  sizes="(min-width: 768px) 33vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
                <figcaption className="absolute bottom-0 left-0 right-0 p-4 font-mono text-label-caps uppercase tracking-widest text-on-surface">
                  {occ.label}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Before / after */}
      <section className="px-margin-mobile md:px-margin-desktop pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <span className="font-mono text-label-caps text-primary tracking-widest uppercase block mb-3">
              Photo to Film
            </span>
            <h2 className="font-display text-headline-xl text-on-surface leading-none">
              Before &amp; after
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
            {BEFORE_AFTERS.map((b) => (
              <div
                key={b.src}
                className="relative aspect-[4/3] overflow-hidden rounded-xl glass-card"
              >
                <Image
                  src={b.src}
                  alt={b.alt}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product */}
      <section className="px-margin-mobile md:px-margin-desktop pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <span className="font-mono text-label-caps text-primary tracking-widest uppercase block mb-3">
              Start Your Project
            </span>
            <h2 className="font-display text-headline-xl text-on-surface leading-none">
              Order your memory video
            </h2>
          </div>
          <div className="max-w-5xl mx-auto space-y-gutter">
            {products.map((product) => (
              <ProductCard
                key={product.slug}
                product={product}
                layout="horizontal"
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
