import type { Metadata } from "next";
import { getProductsByCategory } from "@/lib/products";
import { ProductCard } from "@/components/product/product-card";

export const metadata: Metadata = {
  title: "Personal — Cinematic Memory Videos",
  description:
    "Custom memory videos from your photos. Pets, birthdays, gender reveals, anniversaries — your moment, brought to motion.",
};

export default async function PersonalPage() {
  const products = await getProductsByCategory("personal");

  return (
    <main className="flex-1">
      <section className="relative px-margin-mobile md:px-margin-desktop py-24 overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(circle at 70% 20%, #00b4ff 0%, transparent 50%)",
          }}
          aria-hidden="true"
        />
        <div className="max-w-5xl mx-auto text-center">
          <span className="font-mono text-label-caps text-primary tracking-widest uppercase block mb-4">
            Track 02 — Personal
          </span>
          <h1 className="font-display text-[48px] md:text-headline-xl lg:text-display-lg text-on-surface leading-none mb-6">
            Cinematic Memory Videos
          </h1>
          <p className="font-body text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            Turn the photos that matter into a cinematic 15-second film.
            Pets, birthdays, weddings, memorials — every moment deserves
            motion.
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
