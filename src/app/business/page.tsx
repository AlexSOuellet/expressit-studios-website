import type { Metadata } from "next";
import { getProductsByCategory } from "@/lib/products";
import { ProductCard } from "@/components/product/product-card";

export const metadata: Metadata = {
  title: "Business — Cinematic Product Video Ads",
  description:
    "Custom product video ads built for TikTok, Instagram, YouTube, and your ecommerce store. Cinematic motion graphics, 24–48 hour delivery.",
};

export default async function BusinessPage() {
  const products = await getProductsByCategory("business");

  return (
    <main className="flex-1">
      <section className="relative px-margin-mobile md:px-margin-desktop py-24 overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(circle at 30% 20%, #00e5a0 0%, transparent 50%)",
          }}
          aria-hidden="true"
        />
        <div className="max-w-5xl mx-auto text-center">
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

      <section className="px-margin-mobile md:px-margin-desktop pb-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
