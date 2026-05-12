import type { Metadata } from "next";
import { Mail, Clock, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with ExpressIt Studios. Questions, custom requests, or anything else — email us at alex@expressitstudios.com.",
};

const CONTACT_EMAIL = "alex@expressitstudios.com";

export default function ContactPage() {
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
            we read every email and reply fast.
          </p>
        </div>
      </section>

      <section className="px-margin-mobile md:px-margin-desktop pb-24">
        <div className="max-w-2xl mx-auto glass-card rounded-xl p-12 text-center">
          <Mail
            className="h-12 w-12 text-primary mx-auto mb-6"
            aria-hidden="true"
          />
          <h2 className="font-headline text-headline-md text-on-surface mb-3">
            Email Us
          </h2>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-body text-body-lg text-primary hover:underline break-all"
          >
            {CONTACT_EMAIL}
          </a>
          <div className="mt-8">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="primary-gradient text-on-primary-fixed font-mono text-ui-mono px-8 py-3 rounded-lg uppercase inline-flex items-center gap-2"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Open Email
            </a>
          </div>
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
