import type { Metadata } from "next";
import Image from "next/image";
import { getProductsByCategory } from "@/lib/products";
import { ProductCard } from "@/components/product/product-card";

export const metadata: Metadata = {
  title: "Business — Cinematic Product Video Ads",
  description:
    "Custom product video ads built for TikTok, Instagram, YouTube, and your ecommerce store. Cinematic motion graphics, 24–48 hour delivery.",
};

const SAMPLES = [
  { src: "/samples/business/hyper-motion.mp4", label: "Hyper Motion" },
  { src: "/samples/business/tv-spot-1.mp4", label: "TV Spot — Sneaker" },
  { src: "/samples/business/tv-spot-2.mp4", label: "TV Spot — Macro" },
];

const STILLS = [
  { src: "/examples/business/runner.png", alt: "Runner product ad still" },
  { src: "/examples/business/shatter.png", alt: "Shatter effect product ad" },
  { src: "/examples/business/energy-ring.png", alt: "Energy ring product ad" },
  { src: "/examples/business/tv-macro.png", alt: "Macro product detail still" },
  { src: "/examples/business/tv-barn.png", alt: "Cinematic barn shot still" },
  { src: "/examples/business/tv-wheat.png", alt: "Wheat field commercial still" },
];

const BEFORE_AFTERS = [
  { src: "/examples/business/before-after-1.png", alt: "Before / after — product 1" },
  { src: "/examples/business/before-after-2.png", alt: "Before / after — product 2" },
];

export default async function BusinessPage() {
  const products = await getProductsByCategory("business");

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-12">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/hero/business.png"
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
          <span className="font-mono text-label-caps text-secondary tracking-widest uppercase block mb-4">
            Track 01 — Business
          </span>
          <h1 className="font-display text-[48px] md:text-headline-xl lg:text-display-lg text-on-surface leading-none mb-6">
            Scroll-Stopping Video Ads
          </h1>
          <p className="font-body text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            High-performance video ads built from your product photos.
            Cinematic, on-brand, ready for every platform.
          </p>
        </div>
      </section>

      {/* Recent work — video reels */}
      <section className="px-margin-mobile md:px-margin-desktop py-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <span className="font-mono text-label-caps text-secondary tracking-widest uppercase block mb-3">
              Recent Work
            </span>
            <h2 className="font-display text-headline-xl text-on-surface leading-none">
              Sample reels
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

      {/* Stills grid */}
      <section className="px-margin-mobile md:px-margin-desktop pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <span className="font-mono text-label-caps text-secondary tracking-widest uppercase block mb-3">
              Frame Library
            </span>
            <h2 className="font-display text-headline-xl text-on-surface leading-none">
              Cinematic stills
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-gutter">
            {STILLS.map((still) => (
              <div
                key={still.src}
                className="relative aspect-square overflow-hidden rounded-xl glass-card"
              >
                <Image
                  src={still.src}
                  alt={still.alt}
                  fill
                  sizes="(min-width: 768px) 33vw, 50vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before / after */}
      <section className="px-margin-mobile md:px-margin-desktop pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <span className="font-mono text-label-caps text-secondary tracking-widest uppercase block mb-3">
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
            <span className="font-mono text-label-caps text-secondary tracking-widest uppercase block mb-3">
              Start Your Project
            </span>
            <h2 className="font-display text-headline-xl text-on-surface leading-none">
              Pick your package
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
