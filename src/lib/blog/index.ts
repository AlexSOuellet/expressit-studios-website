import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";

const BLOG_DIR = path.join(process.cwd(), "src", "content", "blog");

// gray-matter parses unquoted YYYY-MM-DD into a JS Date. Accept either and
// normalize to a YYYY-MM-DD string.
const dateString = z
  .union([z.string(), z.date()])
  .transform((v) =>
    v instanceof Date ? v.toISOString().slice(0, 10) : v
  )
  .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/));

export const postFrontmatterSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  description: z.string().min(1).max(160),
  published_at: dateString,
  author: z.string().default("ExpressIt Studios"),
  tags: z.array(z.string()).default([]),
  cover_image: z.string().optional(),
  draft: z.boolean().default(false),
});
export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>;

export type Post = PostFrontmatter & { body: string };

let cache: Post[] | null = null;

export async function getAllPosts(): Promise<Post[]> {
  if (cache) return cache;

  let entries: string[];
  try {
    entries = await fs.readdir(BLOG_DIR);
  } catch {
    cache = [];
    return cache;
  }

  const files = entries.filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));
  const posts: Post[] = [];

  for (const filename of files) {
    const raw = await fs.readFile(path.join(BLOG_DIR, filename), "utf8");
    const { data, content } = matter(raw);
    const parsed = postFrontmatterSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error(
        `Invalid blog post frontmatter in ${filename}: ${parsed.error.message}`
      );
    }
    if (!parsed.data.draft) {
      posts.push({ ...parsed.data, body: content.trim() });
    }
  }

  posts.sort((a, b) => b.published_at.localeCompare(a.published_at));
  cache = posts;
  return cache;
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const all = await getAllPosts();
  return all.find((p) => p.slug === slug) ?? null;
}
