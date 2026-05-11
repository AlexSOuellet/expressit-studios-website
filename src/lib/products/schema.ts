import { z } from "zod";

/**
 * Variant — a distinct SKU with its own price.
 * `attributes` keys must match a `variant_axes[].key` so the UI can render
 * the selector correctly. `id` is what we send to Stripe as metadata.
 */
export const variantSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, "lowercase, digits, hyphens only"),
  label: z.string().min(1),
  price_cents: z.number().int().positive(),
  attributes: z.record(z.string(), z.string()),
  active: z.boolean().default(true),
});
export type Variant = z.infer<typeof variantSchema>;

/**
 * VariantAxis — describes one dimension of the variant grid for UI rendering.
 * Example: a "duration" axis with three options. Each option's `value` is matched
 * against `variant.attributes[axis.key]` to find the selected variant.
 */
export const variantAxisSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  options: z
    .array(
      z.object({
        value: z.string().min(1),
        label: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .min(1),
});
export type VariantAxis = z.infer<typeof variantAxisSchema>;

/**
 * ProductOption — a non-pricing selector the customer picks at checkout
 * (e.g. occasion type for a Personal Memory Video). Recorded as order metadata,
 * never changes price.
 */
export const productOptionSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  required: z.boolean().default(false),
  help_text: z.string().optional(),
  options: z
    .array(
      z.object({
        value: z.string().min(1),
        label: z.string().min(1),
      })
    )
    .min(1),
});
export type ProductOption = z.infer<typeof productOptionSchema>;

export const productImageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1, "Alt text required for accessibility"),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});
export type ProductImage = z.infer<typeof productImageSchema>;

/**
 * Product frontmatter — everything except the long_description body markdown.
 * Validated at build time so a malformed product file fails the build, not prod.
 */
export const productFrontmatterSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "lowercase, digits, hyphens only"),
  title: z.string().min(1),
  category: z.enum(["business", "personal"]),
  short_description: z
    .string()
    .min(1)
    .max(160, "Keep under 160 chars — this is the meta/SEO description"),
  tagline: z.string().optional(),
  variants: z.array(variantSchema).min(1),
  variant_axes: z.array(variantAxisSchema).default([]),
  options: z.array(productOptionSchema).default([]),
  images: z.array(productImageSchema).min(1, "At least one product image required"),
  turnaround_hours: z.number().int().positive().default(48),
  revisions_included: z.number().int().nonnegative().default(2),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      og_image: z.string().optional(),
    })
    .default(() => ({})),
});
export type ProductFrontmatter = z.infer<typeof productFrontmatterSchema>;

/**
 * Product = parsed frontmatter + the markdown body for long-form description.
 */
export type Product = ProductFrontmatter & {
  long_description: string; // raw markdown — render with react-markdown
};

/**
 * Helpers
 */

export function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
}

/**
 * Given a product and a set of selected axis values, find the matching variant.
 * Returns undefined if no exact match — caller should guard.
 */
export function findVariant(
  product: Product,
  selection: Record<string, string>
): Variant | undefined {
  return product.variants.find((v) =>
    Object.entries(selection).every(([k, val]) => v.attributes[k] === val)
  );
}

/**
 * Default selection = first option of every axis. Used as the initial UI state.
 */
export function defaultSelection(product: Product): Record<string, string> {
  return Object.fromEntries(
    product.variant_axes.map((axis) => [axis.key, axis.options[0].value])
  );
}
