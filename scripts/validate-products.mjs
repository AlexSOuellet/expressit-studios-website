#!/usr/bin/env node
// One-shot validation: load every product file, run schema, print summary.
// Used by `npm run check:products` and the prebuild step.

import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";

const ROOT = process.cwd();
const PRODUCTS_DIR = path.join(ROOT, "src", "content", "products");

// Schema mirrored from src/lib/products/schema.ts. Kept in sync manually
// (the build script can't easily import the TS source pre-compile).
const variantSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().min(1),
  price_cents: z.number().int().positive(),
  attributes: z.record(z.string(), z.string()),
  active: z.boolean().default(true),
});

const variantAxisSchema = z.object({
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

const productOptionSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  required: z.boolean().default(false),
  help_text: z.string().optional(),
  options: z
    .array(z.object({ value: z.string().min(1), label: z.string().min(1) }))
    .min(1),
});

const productImageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

const productFrontmatterSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  category: z.enum(["business", "personal"]),
  short_description: z.string().min(1).max(160),
  tagline: z.string().optional(),
  variants: z.array(variantSchema).min(1),
  variant_axes: z.array(variantAxisSchema).default([]),
  options: z.array(productOptionSchema).default([]),
  images: z.array(productImageSchema).min(1),
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

let errors = 0;
const slugs = new Set();
const files = (await fs.readdir(PRODUCTS_DIR)).filter(
  (f) => f.endsWith(".md") || f.endsWith(".mdx")
);

console.log(`\nValidating ${files.length} product file(s) in ${PRODUCTS_DIR}\n`);

for (const filename of files) {
  const raw = await fs.readFile(path.join(PRODUCTS_DIR, filename), "utf8");
  const { data } = matter(raw);
  const parsed = productFrontmatterSchema.safeParse(data);

  if (!parsed.success) {
    errors += parsed.error.issues.length;
    console.log(`❌ ${filename}`);
    for (const issue of parsed.error.issues) {
      console.log(`     ${issue.path.join(".") || "(root)"}: ${issue.message}`);
    }
    continue;
  }

  if (slugs.has(parsed.data.slug)) {
    errors++;
    console.log(`❌ ${filename}: duplicate slug "${parsed.data.slug}"`);
    continue;
  }
  slugs.add(parsed.data.slug);

  // Also check every variant's attributes match a defined axis
  for (const variant of parsed.data.variants) {
    for (const axisKey of Object.keys(variant.attributes)) {
      const axis = parsed.data.variant_axes.find((a) => a.key === axisKey);
      if (!axis) {
        errors++;
        console.log(
          `❌ ${filename}: variant "${variant.id}" uses unknown axis "${axisKey}"`
        );
        continue;
      }
      const value = variant.attributes[axisKey];
      if (!axis.options.find((o) => o.value === value)) {
        errors++;
        console.log(
          `❌ ${filename}: variant "${variant.id}" axis "${axisKey}" uses unknown value "${value}"`
        );
      }
    }
  }

  // Check referenced image paths exist on disk
  for (const image of parsed.data.images) {
    if (image.src.startsWith("/")) {
      const onDisk = path.join(ROOT, "public", image.src.slice(1));
      try {
        await fs.access(onDisk);
      } catch {
        errors++;
        console.log(
          `❌ ${filename}: image "${image.src}" not found at ${onDisk}`
        );
      }
    }
  }

  const prices = parsed.data.variants.map((v) => `$${(v.price_cents / 100).toFixed(2)}`);
  console.log(
    `✓ ${filename} — ${parsed.data.title} [${parsed.data.category}] · ${parsed.data.variants.length} variants · ${prices.join(", ")}`
  );
}

console.log();
if (errors > 0) {
  console.log(`✗ ${errors} validation error(s)`);
  process.exit(1);
}
console.log("✓ All product files valid\n");
