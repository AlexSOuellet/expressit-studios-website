import Link from "next/link";
import { Play } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background — radial glows over the surface */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-surface via-surface to-surface-container-lowest" />
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[80vw] h-[80vw] max-w-[1200px] max-h-[1200px] rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, #00b4ff 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 right-0 w-[60vw] h-[60vw] max-w-[900px] max-h-[900px] rounded-full opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, #00e5a0 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      <div className="relative z-10 text-center px-margin-mobile md:px-margin-desktop py-24 max-w-5xl">
        <span className="font-mono text-label-caps text-primary tracking-widest block mb-4 uppercase">
          Motion Identity Redefined
        </span>

        <h1 className="font-display text-[48px] md:text-display-lg lg:text-[96px] text-on-surface leading-none mb-6">
          Still Photos,{" "}
          <span className="text-primary italic">Cinematic</span> Stories.
        </h1>

        <p className="font-body text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-12">
          We transform your photos into high-fidelity narrative films —
          scroll-stopping product ads for your business, and emotional memory
          videos for the moments that matter.
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <Link
            href="/business"
            className="primary-gradient text-on-primary-fixed font-mono text-ui-mono px-12 py-4 rounded-lg uppercase inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            Start Your Video <Play className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/personal"
            className="glass-card text-on-surface font-mono text-ui-mono px-12 py-4 rounded-lg uppercase hover:border-primary/50 transition-colors"
          >
            View Personal
          </Link>
        </div>
      </div>
    </section>
  );
}
