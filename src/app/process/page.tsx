import type { Metadata } from "next";
import Link from "next/link";
import { CloudUpload, Sparkles, Rocket, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "The ExpressIt Studios process: upload your photos, we craft a cinematic video, you receive your finished MP4 in 24–48 hours.",
};

const STEPS = [
  {
    number: "01",
    icon: CloudUpload,
    title: "Buy & Upload",
    body: "Pick the package that fits — a single product ad, a 3-video bundle, or a personal memory video. After checkout, send us your photos by email or a Dropbox / Drive link. The higher resolution the better, but phone photos work great.",
    accent: "primary" as const,
  },
  {
    number: "02",
    icon: Sparkles,
    title: "We Craft Your Video",
    body: "Our editors transform your photos into a cinematic, high-fidelity video. Color graded for mood. Music suggested (or send your own). Built for the platform you'll post it on — vertical, square, or horizontal.",
    accent: "secondary" as const,
  },
  {
    number: "03",
    icon: Rocket,
    title: "Delivery in 24–48 Hours",
    body: "Receive your finished MP4 ready to share. 2 revisions included — tell us what you want adjusted and we'll dial it in. Done.",
    accent: "primary" as const,
  },
];

export default function ProcessPage() {
  return (
    <main className="flex-1">
      <section className="px-margin-mobile md:px-margin-desktop py-24">
        <div className="max-w-3xl mx-auto text-center">
          <span className="font-mono text-label-caps text-primary tracking-widest uppercase block mb-4">
            The Cinematic Workflow
          </span>
          <h1 className="font-display text-[48px] md:text-display-lg text-on-surface leading-none mb-6">
            How It Works
          </h1>
          <p className="font-body text-body-lg text-on-surface-variant">
            Three steps from photo to film. No subscriptions, no surprises —
            just cinematic video delivered fast.
          </p>
        </div>
      </section>

      <section className="px-margin-mobile md:px-margin-desktop pb-24">
        <div className="max-w-4xl mx-auto space-y-12">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const accentClass =
              step.accent === "primary"
                ? "text-primary border-primary/30"
                : "text-secondary border-secondary/30";
            return (
              <div
                key={step.number}
                className={`glass-card rounded-xl p-12 border-l-2 ${accentClass}`}
              >
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex items-start gap-4 md:w-1/3">
                    <div
                      className={`w-16 h-16 rounded-full glass-card flex items-center justify-center shrink-0 ${accentClass.split(" ")[0]}`}
                    >
                      <Icon className="h-7 w-7" aria-hidden="true" />
                    </div>
                    <div>
                      <span className="font-mono text-label-caps text-outline uppercase tracking-widest block mb-2">
                        Step {step.number}
                      </span>
                      <h2 className="font-headline text-headline-md text-on-surface">
                        {step.title}
                      </h2>
                    </div>
                  </div>
                  <p className="font-body text-body-lg text-on-surface-variant md:flex-1">
                    {step.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-margin-mobile md:px-margin-desktop pb-24">
        <div className="max-w-3xl mx-auto glass-card rounded-xl p-12 text-center">
          <Mail className="h-10 w-10 text-primary mx-auto mb-4" aria-hidden="true" />
          <h2 className="font-headline text-headline-md text-on-surface mb-3">
            Questions before you order?
          </h2>
          <p className="font-body text-body-md text-on-surface-variant mb-6">
            We&rsquo;re happy to walk you through what you&rsquo;ll get and
            how to send us your photos.
          </p>
          <a
            href="mailto:AlexSOuellet@gmail.com"
            className="primary-gradient text-on-primary-fixed font-mono text-ui-mono px-8 py-3 rounded-lg uppercase inline-flex items-center gap-2"
          >
            Email Us
          </a>
        </div>

        <div className="max-w-4xl mx-auto mt-16 flex flex-col md:flex-row gap-4 justify-center">
          <Link
            href="/business"
            className="primary-gradient text-on-primary-fixed font-mono text-ui-mono px-12 py-4 rounded-lg uppercase text-center"
          >
            Shop Business
          </Link>
          <Link
            href="/personal"
            className="glass-card text-on-surface font-mono text-ui-mono px-12 py-4 rounded-lg uppercase text-center"
          >
            Shop Personal
          </Link>
        </div>
      </section>
    </main>
  );
}
