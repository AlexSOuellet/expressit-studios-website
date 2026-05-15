import type { Metadata } from "next";
import { Clock, MessageCircle } from "lucide-react";
import { ContactForm } from "@/components/site/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with ExpressIt Studios. Questions about a project, custom requests, or anything else — send us a message.",
};

// Deep-link from /order/<id> can carry order context so Alex knows which
// order the message is about without the customer needing to find their ID.
export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; v?: string }>;
}) {
  const sp = await searchParams;
  const orderShort = sp.order?.slice(0, 8);
  const videoIndex = sp.v && /^\d+$/.test(sp.v) ? sp.v : undefined;

  let initialSubject = "";
  let initialMessage = "";
  if (orderShort) {
    const which = videoIndex ? ` — Video ${videoIndex}` : "";
    initialSubject = `Order ${orderShort}${which}`;
    initialMessage =
      `Order: ${sp.order}${videoIndex ? `\nVideo: ${videoIndex}` : ""}\n\n`;
  }

  return (
    <main className="flex-1">
      <section className="px-margin-mobile md:px-margin-desktop py-24">
        <div className="max-w-3xl mx-auto text-center">
          <span className="font-mono text-label-caps text-primary tracking-widest uppercase block mb-4">
            Talk to a Real Human
          </span>
          <h1 className="font-display text-[48px] md:text-display-lg text-on-surface leading-none mb-6">
            Get in Touch
          </h1>
          <p className="font-body text-body-lg text-on-surface-variant">
            Questions about a project, custom requests, or anything else —
            send us a message. We read every one and reply fast.
          </p>
        </div>
      </section>

      <section className="px-margin-mobile md:px-margin-desktop pb-24">
        <div className="max-w-2xl mx-auto">
          <ContactForm
            initialSubject={initialSubject}
            initialMessage={initialMessage}
          />
        </div>

        <div className="max-w-4xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-2 gap-gutter">
          <div className="glass-card rounded-xl p-8 border-l-2 border-primary/30">
            <Clock
              className="h-7 w-7 text-primary mb-4"
              aria-hidden="true"
            />
            <h3 className="font-headline text-headline-sm text-on-surface mb-2">
              Reply Time
            </h3>
            <p className="font-body text-body-md text-on-surface-variant">
              Usually within a few hours during the day. Always within 24
              hours.
            </p>
          </div>
          <div className="glass-card rounded-xl p-8 border-l-2 border-secondary/30">
            <MessageCircle
              className="h-7 w-7 text-secondary mb-4"
              aria-hidden="true"
            />
            <h3 className="font-headline text-headline-sm text-on-surface mb-2">
              What to Include
            </h3>
            <p className="font-body text-body-md text-on-surface-variant">
              The package you&rsquo;re interested in, your photos or a
              Dropbox / Drive link, and any notes on vibe, music, or style.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
