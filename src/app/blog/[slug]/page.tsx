import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { getAllPosts, getPostBySlug } from "@/lib/blog";

const formatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: `/blog/${post.slug}`,
      publishedTime: post.published_at,
      authors: [post.author],
      ...(post.cover_image && { images: [post.cover_image] }),
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <main className="flex-1 px-margin-mobile md:px-margin-desktop py-24">
      <article className="max-w-3xl mx-auto">
        <header className="mb-12">
          <Link
            href="/blog"
            className="font-mono text-label-caps uppercase tracking-widest text-primary hover:underline inline-block mb-6"
          >
            ← All posts
          </Link>
          <span className="font-mono text-label-caps text-outline uppercase tracking-widest block mb-3">
            {formatter.format(new Date(post.published_at))} · {post.author}
          </span>
          <h1 className="font-display text-[48px] md:text-display-lg text-on-surface leading-none mb-4">
            {post.title}
          </h1>
          <p className="font-body text-body-lg text-on-surface-variant">
            {post.description}
          </p>
        </header>

        <div className="font-body text-body-md text-on-surface-variant">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h2 className="font-headline text-headline-md text-on-surface mt-10 mb-3">
                  {children}
                </h2>
              ),
              h2: ({ children }) => (
                <h2 className="font-headline text-headline-md text-on-surface mt-10 mb-3">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="font-headline text-headline-sm text-on-surface mt-6 mb-2">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="mb-4 leading-relaxed">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="mb-6 space-y-2 list-disc pl-6">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-6 space-y-2 list-decimal pl-6">{children}</ol>
              ),
              strong: ({ children }) => (
                <strong className="text-on-surface font-semibold">
                  {children}
                </strong>
              ),
              a: ({ children, href }) => (
                <a href={href} className="text-primary hover:underline">
                  {children}
                </a>
              ),
              em: ({ children }) => (
                <em className="italic text-on-surface-variant">{children}</em>
              ),
              hr: () => <hr className="my-8 border-outline-variant/30" />,
            }}
          >
            {post.body}
          </ReactMarkdown>
        </div>
      </article>
    </main>
  );
}
