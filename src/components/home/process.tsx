import { CloudUpload, Sparkles, Rocket } from "lucide-react";

const STEPS = [
  {
    icon: CloudUpload,
    title: "Upload",
    body: "Drop your high-res photos into our encrypted creative pipeline after checkout.",
    accent: "primary" as const,
  },
  {
    icon: Sparkles,
    title: "Cinematic Edit",
    body: "Our team enhances, color grades, and edits your photos into a high-fidelity narrative.",
    accent: "secondary" as const,
  },
  {
    icon: Rocket,
    title: "Delivery",
    body: "Receive your finished MP4 in 24–48 hours. 2 revisions included.",
    accent: "primary" as const,
  },
];

export function Process() {
  return (
    <section className="bg-surface-container-lowest py-24">
      <div className="px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto">
        <div className="mb-16 text-center">
          <span className="font-mono text-label-caps text-primary tracking-widest uppercase">
            The Cinematic Workflow
          </span>
          <h2 className="font-headline text-headline-xl text-on-surface mt-2">
            Seamless Creation
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter relative">
          <div
            className="hidden md:block absolute top-10 left-0 w-full h-px bg-white/5 z-0"
            aria-hidden="true"
          />
          {STEPS.map((step) => {
            const Icon = step.icon;
            const accentClass =
              step.accent === "primary"
                ? "text-primary group-hover:border-primary"
                : "text-secondary group-hover:border-secondary";
            return (
              <div
                key={step.title}
                className="relative z-10 flex flex-col items-center text-center group"
              >
                <div
                  className={`w-20 h-20 rounded-full glass-card flex items-center justify-center mb-6 transition-all duration-300 ${accentClass}`}
                >
                  <Icon className="h-8 w-8" aria-hidden="true" />
                </div>
                <h4 className="font-headline text-headline-sm text-on-surface mb-2">
                  {step.title}
                </h4>
                <p className="font-body text-body-md text-outline max-w-xs">
                  {step.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
