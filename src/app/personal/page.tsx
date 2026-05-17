import type { Metadata } from "next";
import { getProductsByCategory } from "@/lib/products";
import { ProductCard } from "@/components/product/product-card";
import { ReelSlider, type Reel } from "@/components/home/reel-slider";

export const metadata: Metadata = {
  title: "Personal — Cinematic Memory Videos",
  description:
    "Custom memory videos from your photos. Pets, birthdays, gender reveals, anniversaries — your moment, brought to motion.",
};

// Hero plays at its natural aspect with a blurred backdrop filling the
// letterbox — works for both portrait and landscape sources without zoom.
const HERO_REEL = "/samples/personal/pet.mp4";

const REELS: Reel[] = [
  { src: "/samples/personal/birthday.mp4", label: "Birthday" },
  { src: "/samples/personal/gender-reveal.mp4", label: "Gender Reveal" },
  { src: "/samples/personal/scrappydoo.mp4", label: "Pet Tribute" },
];

export default async function PersonalPage() {
  const products = await getProductsByCategory("personal");

  return (
    <main className="flex-1">
      {/* Hero — natural-aspect video with blurred backdrop */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-12 bg-black">
        <div className="absolute inset-0">
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

      {/* Sample reels — one at a time, real size */}
      <section className="px-margin-mobile md:px-margin-desktop py-24 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 text-center">
            <span className="font-mono text-label-caps text-primary tracking-widest uppercase block mb-3">
              Recent Work
            </span>
            <h2 className="font-display text-headline-xl text-on-surface leading-none">
              Sample memories
            </h2>
          </div>
          <ReelSlider reels={REELS} />
        </div>
      </section>

      {/* Product */}
      <section className="px-margin-mobile md:px-margin-desktop pb-24 pt-12 border-t border-white/5">
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
