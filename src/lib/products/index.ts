import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {
  productFrontmatterSchema,
  type Product,
} from "./schema";

const PRODUCTS_DIR = path.join(process.cwd(), "src", "content", "products");

let cache: Product[] | null = null;

async function loadProductFile(filename: string): Promise<Product> {
  const fullPath = path.join(PRODUCTS_DIR, filename);
  const raw = await fs.readFile(fullPath, "utf8");
  const { data, content } = matter(raw);

  const parsed = productFrontmatterSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid product frontmatter in ${filename}:\n${issues}`
    );
  }

  return {
    ...parsed.data,
    long_description: content.trim(),
  };
}

/**
 * Loads every product file from src/content/products/.
 * Cached after first call — products are static at build time.
 */
export async function getAllProducts(): Promise<Product[]> {
  if (cache) return cache;

  const files = await fs.readdir(PRODUCTS_DIR);
  const markdownFiles = files.filter(
    (f) => f.endsWith(".md") || f.endsWith(".mdx")
  );

  const products = await Promise.all(markdownFiles.map(loadProductFile));

  // Build-time uniqueness check: no two products can share a slug.
  const seen = new Set<string>();
  for (const p of products) {
    if (seen.has(p.slug)) {
      throw new Error(`Duplicate product slug: ${p.slug}`);
    }
    seen.add(p.slug);
  }

  cache = products;
  return products;
}

export async function getActiveProducts(): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.active);
}

export async function getProductsByCategory(
  category: "business" | "personal"
): Promise<Product[]> {
  const all = await getActiveProducts();
  return all.filter((p) => p.category === category);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const all = await getAllProducts();
  return all.find((p) => p.slug === slug) ?? null;
}

export * from "./schema";
