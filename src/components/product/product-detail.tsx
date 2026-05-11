"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { Loader2 } from "lucide-react";
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
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Image gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-xl glass-card">
            <Image
              src={product.images[0].src}
              alt={product.images[0].alt}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(1).map((img) => (
                <div
                  key={img.src}
                  className="relative aspect-square overflow-hidden rounded-md glass-card"
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="20vw"
                    className="object-cover"
                  />
                </div>
              ))}
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
