"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  type Product,
  findVariant,
  defaultSelection,
  formatPrice,
} from "@/lib/products/schema";

type CheckoutResponse = { url: string } | { error: string };

export function ProductDetail({ product }: { product: Product }) {
  const [selection, setSelection] = useState<Record<string, string>>(
    defaultSelection(product)
  );
  const [optionValues, setOptionValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      product.options.map((o) => [o.key, o.required ? "" : o.options[0].value])
    )
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState(0);
  const imageCount = product.images.length;
  const goPrev = () =>
    setCurrentImage((i) => (i - 1 + imageCount) % imageCount);
  const goNext = () => setCurrentImage((i) => (i + 1) % imageCount);

  const variant = useMemo(() => findVariant(product, selection), [
    product,
    selection,
  ]);

  const missingRequiredOption = product.options.find(
    (o) => o.required && !optionValues[o.key]
  );

  async function handleBuy() {
    if (!variant) return;
    if (missingRequiredOption) {
      setError(`Please choose a ${missingRequiredOption.label.toLowerCase()}.`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: product.slug,
          variantId: variant.id,
          options: optionValues,
        }),
      });
      const data = (await res.json()) as CheckoutResponse;
      if (!res.ok || "error" in data) {
        setError("error" in data ? data.error : "Could not start checkout.");
        setSubmitting(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 px-margin-mobile md:px-margin-desktop py-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image slideshow */}
        <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl glass-card group">
            {product.images.map((img, i) => {
              const isVideo = /\.(mp4|webm|mov)$/i.test(img.src);
              const isActive = i === currentImage;
              return isVideo ? (
                <video
                  key={img.src}
                  src={img.src}
                  autoPlay={isActive}
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  aria-label={img.alt}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                    isActive ? "opacity-100" : "opacity-0 pointer-events-none"
                  }`}
                />
              ) : (
                <Image
                  key={img.src}
                  src={img.src}
                  alt={img.alt}
                  fill
                  priority={i === 0}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className={`object-cover transition-opacity duration-300 ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                />
              );
            })}
            {imageCount > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-surface-container-lowest/80 backdrop-blur border border-white/10 text-on-surface hover:bg-surface-container-lowest opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-surface-container-lowest/80 backdrop-blur border border-white/10 text-on-surface hover:bg-surface-container-lowest opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                  {product.images.map((img, i) => (
                    <button
                      key={img.src}
                      type="button"
                      onClick={() => setCurrentImage(i)}
                      aria-label={`Go to image ${i + 1}`}
                      aria-current={i === currentImage}
                      className={`h-2 rounded-full transition-all ${
                        i === currentImage
                          ? "w-6 bg-primary"
                          : "w-2 bg-white/40 hover:bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          {imageCount > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img, i) => {
                const isVideo = /\.(mp4|webm|mov)$/i.test(img.src);
                return (
                  <button
                    key={img.src}
                    type="button"
                    onClick={() => setCurrentImage(i)}
                    aria-label={`Show ${img.alt}`}
                    aria-current={i === currentImage}
                    className={`relative aspect-square overflow-hidden rounded-md glass-card transition-all ${
                      i === currentImage
                        ? "ring-2 ring-primary"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    {isVideo ? (
                      <>
                        <video
                          src={img.src}
                          muted
                          playsInline
                          preload="metadata"
                          aria-label={img.alt}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <span
                          aria-hidden="true"
                          className="absolute bottom-1 right-1 text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-background/80 text-on-surface"
                        >
                          Video
                        </span>
                      </>
                    ) : (
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        sizes="20vw"
                        className="object-cover"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Details + buy */}
        <div>
          <span className="font-mono text-label-caps text-primary tracking-widest uppercase block mb-3">
            {product.category === "business" ? "Business" : "Personal"}
          </span>
          <h1 className="font-display text-headline-xl md:text-display-lg text-on-surface leading-none mb-4">
            {product.title}
          </h1>
          <p className="font-body text-body-lg text-on-surface-variant mb-8">
            {product.short_description}
          </p>

          <div className="flex items-baseline gap-4 mb-8">
            <span className="font-headline text-headline-md text-primary">
              {variant ? formatPrice(variant.price_cents) : "—"}
            </span>
            <span className="font-mono text-ui-mono text-on-surface-variant">
              Delivered in {product.turnaround_hours} hours · {product.revisions_included} revisions
            </span>
          </div>

          {/* Variant axes */}
          {product.variant_axes.map((axis) => (
            <fieldset key={axis.key} className="mb-6">
              <legend className="font-mono text-label-caps text-on-surface-variant uppercase tracking-widest mb-3">
                {axis.label}
              </legend>
              <div className="flex flex-wrap gap-2">
                {axis.options.map((opt) => {
                  const isSelected = selection[axis.key] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setSelection((s) => ({ ...s, [axis.key]: opt.value }))
                      }
                      className={`px-4 py-3 rounded-lg font-mono text-ui-mono uppercase tracking-wider border transition-colors ${
                        isSelected
                          ? "bg-primary text-on-primary border-primary"
                          : "bg-surface-container border-outline-variant text-on-surface-variant hover:border-primary/50"
                      }`}
                      aria-pressed={isSelected}
                    >
                      <span className="block">{opt.label}</span>
                      {opt.description && (
                        <span
                          className={`block text-[10px] mt-1 ${
                            isSelected ? "text-on-primary/80" : "text-outline"
                          }`}
                        >
                          {opt.description}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

          {/* Non-pricing options (e.g. occasion) */}
          {product.options.map((opt) => (
            <fieldset key={opt.key} className="mb-6">
              <legend className="font-mono text-label-caps text-on-surface-variant uppercase tracking-widest mb-3">
                {opt.label}
                {opt.required && (
                  <span className="text-tertiary ml-1" aria-label="required">
                    *
                  </span>
                )}
              </legend>
              {opt.help_text && (
                <p className="font-body text-body-md text-outline mb-3">
                  {opt.help_text}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {opt.options.map((choice) => {
                  const isSelected = optionValues[opt.key] === choice.value;
                  return (
                    <button
                      key={choice.value}
                      type="button"
                      onClick={() =>
                        setOptionValues((v) => ({
                          ...v,
                          [opt.key]: choice.value,
                        }))
                      }
                      className={`px-4 py-2 rounded-lg font-mono text-ui-mono uppercase tracking-wider border transition-colors ${
                        isSelected
                          ? "bg-primary text-on-primary border-primary"
                          : "bg-surface-container border-outline-variant text-on-surface-variant hover:border-primary/50"
                      }`}
                      aria-pressed={isSelected}
                    >
                      {choice.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

          {/* Buy button */}
          <button
            type="button"
            onClick={handleBuy}
            disabled={!variant || submitting}
            className="primary-gradient text-on-primary-fixed font-mono text-ui-mono px-12 py-4 rounded-lg uppercase w-full inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Redirecting to Stripe…
              </>
            ) : variant ? (
              <>Buy for {formatPrice(variant.price_cents)}</>
            ) : (
              <>Select an option</>
            )}
          </button>

          {error && (
            <p
              role="alert"
              className="mt-4 font-body text-body-md text-error"
            >
              {error}
            </p>
          )}

          {/* Long description */}
          {product.long_description && (
            <div className="mt-12 prose-styles">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h2 className="font-headline text-headline-md text-on-surface mt-8 mb-3">
                      {children}
                    </h2>
                  ),
                  h2: ({ children }) => (
                    <h2 className="font-headline text-headline-md text-on-surface mt-8 mb-3">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="font-headline text-headline-sm text-on-surface mt-6 mb-2">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="font-body text-body-md text-on-surface-variant mb-4">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="font-body text-body-md text-on-surface-variant mb-4 space-y-2 list-disc pl-6">
                      {children}
                    </ul>
                  ),
                  strong: ({ children }) => (
                    <strong className="text-on-surface font-semibold">
                      {children}
                    </strong>
                  ),
                  a: ({ children, href }) => (
                    <a
                      href={href}
                      className="text-primary hover:underline"
                    >
                      {children}
                    </a>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-on-surface-variant">
                      {children}
                    </em>
                  ),
                  hr: () => (
                    <hr className="my-8 border-outline-variant/30" />
                  ),
                }}
              >
                {product.long_description}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
