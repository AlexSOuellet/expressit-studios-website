import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Notes from the studio: tips on cinematic video, behind-the-scenes, and updates from ExpressIt Studios.",
};

const formatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default async function BlogIndexPage() {
  const posts = await getAllPosts();

  return (
    <main className="flex-1 px-margin-mobile md:px-margin-desktop py-24">
      <header className="max-w-3xl mx-auto text-center mb-16">
        <span className="font-mono text-label-caps text-primary tracking-widest uppercase block mb-4">
          Notes from the studio
        </span>
        <h1 className="font-display text-[48px] md:text-display-lg text-on-surface leading-none mb-4">
          Blog
        </h1>
        <p className="font-body text-body-lg text-on-surface-variant">
          Tips on cinematic video, behind-the-scenes, and what we&rsquo;re working on.
        </p>
      </header>

      <div className="max-w-3xl mx-auto space-y-6">
        {posts.length === 0 ? (
          <p className="text-center font-body text-body-md text-on-surface-variant">
            No posts yet. Check back soon.
          </p>
        ) : (
          posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="glass-card glow-shadow rounded-xl p-8 block group"
            >
              <span className="font-mono text-label-caps text-outline uppercase tracking-widest block mb-2">
                {formatter.format(new Date(post.published_at))}
              </span>
              <h2 className="font-headline text-headline-md text-on-surface group-hover:text-primary transition-colors mb-3">
                {post.title}
              </h2>
              <p className="font-body text-body-md text-on-surface-variant">
                {post.description}
              </p>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
