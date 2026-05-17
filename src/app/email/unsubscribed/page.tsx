import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Unsubscribed",
  description: "You've been unsubscribed from ExpressIt Studios marketing emails.",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ error?: string }>;

export default async function UnsubscribedPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error } = await searchParams;
  const failed = error === "1";

  return (
    <main className="flex-1 px-margin-mobile md:px-margin-desktop py-24">
      <article className="max-w-2xl mx-auto space-y-6 font-body text-body-md text-on-surface-variant">
        <header>
          <span className="font-mono text-label-caps text-primary tracking-widest uppercase block mb-3">
            Email
          </span>
          <h1 className="font-display text-headline-xl text-on-surface mb-2">
            {failed ? "Couldn't unsubscribe" : "You're unsubscribed"}
          </h1>
        </header>

        {failed ? (
          <p>
            That link didn't check out — it may have been mistyped or it's no
            longer valid. Reach out at{" "}
            <Link href="/contact" className="underline">
              /contact
            </Link>{" "}
            and we'll take care of it directly.
          </p>
        ) : (
          <>
            <p>
              Done — you won't receive marketing emails from ExpressIt Studios.
            </p>
            <p className="text-body-sm text-outline">
              Note: if you have an active order, you'll still get the
              transactional emails for <em>that</em> order (payment confirmation,
              "your video is ready", etc.) — those are part of the service you
              paid for. Marketing and broadcast emails are off.
            </p>
            <p>
              Changed your mind?{" "}
              <Link href="/contact" className="underline">
                Get in touch
              </Link>
              .
            </p>
          </>
        )}
      </article>
    </main>
  );
}
