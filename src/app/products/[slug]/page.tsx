import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getActiveProducts, getProductBySlug } from "@/lib/products";
import { ProductDetail } from "@/components/product/product-detail";
import { formatPrice } from "@/lib/products/schema";

export async function generateStaticParams() {
  const products = await getActiveProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const title = product.seo.title ?? product.title;
  const description = product.seo.description ?? product.short_description;
  const ogImage =
    product.seo.og_image ??
    product.images.find((i) => !/\.(mp4|webm|mov)$/i.test(i.src))?.src;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `/products/${product.slug}`,
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.active) notFound();

  const prices = product.variants.map((v) => v.price_cents);
  const lowPrice = (Math.min(...prices) / 100).toFixed(2);
  const highPrice = (Math.max(...prices) / 100).toFixed(2);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.short_description,
    image: product.images
      .filter((i) => !/\.(mp4|webm|mov)$/i.test(i.src))
      .map((i) =>
        i.src.startsWith("http")
          ? i.src
          : `https://expressitstudios.com${i.src}`
      ),
    brand: { "@type": "Brand", name: "ExpressIt Studios" },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice,
      highPrice,
      offerCount: product.variants.length,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetail product={product} />
    </>
  );
}
