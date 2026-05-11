import { CloudUpload, Sparkles, Rocket } from "lucide-react";

const STEPS = [
  {
    icon: CloudUpload,
    title: "Upload",
    body: "Drop your high-res stills directly into our encrypted creative pipeline.",
    accent: "primary" as const,
    glow: "rgba(0, 180, 255, 0.25)",
  },
  {
    icon: Sparkles,
    title: "AI Enhancement",
    body: "Our proprietary engines inject temporal coherence and cinematic flow.",
    accent: "secondary" as const,
    glow: "rgba(0, 229, 160, 0.25)",
  },
  {
    icon: Rocket,
    title: "Delivery",
    body: "Receive your motion masterpiece in high resolution within 48 hours.",
    accent: "tertiary" as const,
    glow: "rgba(245, 166, 35, 0.25)",
  },
];

const ACCENT_MAP = {
  primary: "text-primary border-primary/40",
  secondary: "text-secondary border-secondary/40",
  tertiary: "text-tertiary border-tertiary/40",
} as const;

export function Process() {
  return (
    <section className="bg-surface-container-lowest py-24 relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10 opacity-30"
        style={{
          background:
            "radial-gradient(circle at 50% 100%, rgba(0, 229, 160, 0.15) 0%, transparent 60%)",
        }}
        aria-hidden="true"
      />
      <div className="px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto">
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <span className="font-mono text-label-caps text-primary tracking-widest uppercase">
            The Cinematic Workflow
          </span>
          <h2 className="font-display text-headline-xl md:text-display-lg text-on-surface mt-3 leading-none">
            Seamless Creation
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter relative">
          <div
            className="hidden md:block absolute top-10 left-12 right-12 h-px bg-gradient-to-r from-primary/30 via-secondary/30 to-tertiary/30 z-0"
            aria-hidden="true"
          />
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="relative z-10 flex flex-col items-center text-center group"
              >
                <div
                  className={`w-20 h-20 rounded-full glass-card flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 ${ACCENT_MAP[step.accent]}`}
                  style={{
                    boxShadow: `0 0 30px ${step.glow}`,
                  }}
                >
                  <Icon className="h-8 w-8" aria-hidden="true" />
                </div>
                <span className="font-mono text-label-caps text-outline uppercase tracking-widest mb-2">
                  Step {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-headline text-headline-sm text-on-surface mb-2">
                  {step.title}
                </h3>
                <p className="font-body text-body-md text-on-surface-variant w-full max-w-[20rem] mx-auto">
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
