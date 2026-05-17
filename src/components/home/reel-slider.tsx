"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type Reel = { src: string; label: string };

// Single full-width video at a time, with arrow nav + dot indicators.
// Replaces the old 3-up grid where similar-looking videos sat side by side
// and made the page feel repetitive. Each slide gets the full stage so the
// reel actually has room to read as itself.
export function ReelSlider({ reels }: { reels: Reel[] }) {
  const [i, setI] = useState(0);
  const count = reels.length;

  const go = useCallback(
    (next: number) => setI(((next % count) + count) % count),
    [count]
  );

  if (count === 0) return null;

  const current = reels[i];

  return (
    <div className="relative group">
      <div className="relative w-full aspect-[9/16] sm:aspect-[4/5] md:aspect-video rounded-2xl overflow-hidden bg-black">
        {/* Key on src so switching slides always remounts and autoplay actually
            fires; the previous overlay approach left non-active videos
            unplayable on click. */}
        <video
          key={current.src}
          src={current.src}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-contain"
        />
        {/* Blurred copy fills the letterbox so portrait reels don't sit on a
            flat black rectangle. */}
        <video
          key={current.src + ":bg"}
          src={current.src}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-50 -z-0"
        />

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(i - 1)}
              aria-label="Previous reel"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/50 backdrop-blur text-white opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-black/70 transition-opacity"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(i + 1)}
              aria-label="Next reel"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/50 backdrop-blur text-white opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-black/70 transition-opacity"
            >
              <ChevronRight className="h-6 w-6" aria-hidden="true" />
            </button>
          </>
        )}

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 px-4 py-2 rounded-full bg-black/50 backdrop-blur">
          <span className="font-mono text-ui-mono uppercase tracking-widest text-white">
            {current.label}
          </span>
          {count > 1 && (
            <div className="flex items-center gap-1.5">
              {reels.map((r, idx) => (
                <button
                  key={r.src}
                  type="button"
                  onClick={() => go(idx)}
                  aria-label={`Show ${r.label}`}
                  aria-current={idx === i}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === i
                      ? "w-6 bg-white"
                      : "w-1.5 bg-white/40 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
