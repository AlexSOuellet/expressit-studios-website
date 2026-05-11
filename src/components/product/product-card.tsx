import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/products/schema";
import { formatPrice } from "@/lib/products/schema";

function priceRange(product: Product): string {
  const prices = product.variants
    .filter((v) => v.active !== false)
    .map((v) => v.price_cents);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return formatPrice(min);
  return `${formatPrice(min)} – ${formatPrice(max)}`;
}

export function ProductCard({ product }: { product: Product }) {
  const cover = product.images[0];
  return (
    <Link
      href={`/products/${product.slug}`}
      className="gradient-border glass-card glow-shadow rounded-xl overflow-hidden group flex flex-col"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={cover.src}
          alt={cover.alt}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-transparent to-transparent" />
      </div>
      <div className="p-6 flex flex-col flex-1">
        <span className="font-mono text-label-caps text-primary mb-2 uppercase tracking-widest">
          {product.category === "business" ? "Business" : "Personal"}
        </span>
        <h3 className="font-headline text-headline-md text-on-surface mb-2">
          {product.title}
        </h3>
        <p className="font-body text-body-md text-on-surface-variant mb-6 flex-1">
          {product.short_description}
        </p>
        <div className="flex items-center justify-between">
          <span className="font-mono text-ui-mono text-on-surface">
            {priceRange(product)}
          </span>
          <span className="font-mono text-label-caps uppercase tracking-widest text-primary group-hover:translate-x-1 transition-transform">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
