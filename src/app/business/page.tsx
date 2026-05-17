import type { Metadata } from "next";
import { getProductsByCategory } from "@/lib/products";
import { ProductCard } from "@/components/product/product-card";
import { ReelSlider, type Reel } from "@/components/home/reel-slider";

export const metadata: Metadata = {
  title: "Business — Cinematic Product Video Ads",
  description:
    "Custom product video ads built for TikTok, Instagram, YouTube, and your ecommerce store. Cinematic motion graphics, 24–48 hour delivery.",
};

// Hero uses the landscape TV spot so a full-bleed background reads correctly
// instead of being cropped/zoomed (the vertical reels were unusable as bg).
// Slider below covers the rest — no duplicate of the hero in the slider.
const HERO_REEL = "/samples/business/tv-spot-1.mp4";

const REELS: Reel[] = [
  { src: "/samples/business/etsy-product-reel.mp4", label: "Etsy Product Reel" },
  { src: "/samples/business/ugc.mp4", label: "UGC Ad" },
  { src: "/samples/business/tv-spot-2.mp4", label: "TV Spot — Macro" },
];

export default async function BusinessPage() {
  const products = await getProductsByCategory("business");

  return (
    <main className="flex-1">
      {/* Hero — video plays at its natural aspect (no zoom/crop) with a
          blurred copy filling the letterbox so the bg still feels alive. */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-12 bg-black">
        <div className="absolute inset-0">
          {/* Blurred backdrop covers the full area */}
          <video
            src={HERO_REEL}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-50"
          />
          {/* Sharp video at natural aspect — no crop */}
          <video
            src={HERO_REEL}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-contain opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
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

      {/* Sample reels — one at a time, real size */}
      <section className="px-margin-mobile md:px-margin-desktop py-24 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 text-center">
            <span className="font-mono text-label-caps text-secondary tracking-widest uppercase block mb-3">
              Recent Work
            </span>
            <h2 className="font-display text-headline-xl text-on-surface leading-none">
              Sample reels
            </h2>
          </div>
          <ReelSlider reels={REELS} />
        </div>
      </section>

      {/* Product */}
      <section className="px-margin-mobile md:px-margin-desktop pb-24 pt-12 border-t border-white/5">
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
