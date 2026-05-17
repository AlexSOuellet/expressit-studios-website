import Image from "next/image";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-12">
      {/* Cinematic studio background — bleeds past the section into Tracks */}
      <div className="absolute inset-x-0 top-0 h-[140vh] -z-10 pointer-events-none">
        <Image
          src="/hero/studio.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-40"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
      </div>

      <div className="relative z-10 text-center px-margin-mobile md:px-margin-desktop max-w-4xl mx-auto">
        <span className="font-mono text-label-caps text-primary tracking-widest block mb-4 uppercase">
          Motion Identity Redefined
        </span>

        <h1 className="font-display text-[44px] md:text-[72px] lg:text-[96px] text-on-surface leading-[1.05] mb-8">
          Still Photos{" "}
          <span className="italic text-primary inline-block pr-[0.1em]">
            Cinematic
          </span>{" "}
          Stories
        </h1>

        <p className="font-body text-body-lg text-on-surface-variant max-w-2xl mx-auto">
          We transform your static captures into high-fidelity narrative films
          using state-of-the-art enhancement and avant-garde editing
          techniques.
        </p>
      </div>
    </section>
  );
}
