"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const BARS = 25;

// Visual only: a soft waveform behind the orb. It does not react to any audio yet.
export function Waveform() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-bar]").forEach((bar, index) => {
        // Taller in the middle, with a different rhythm per bar.
        const centre = 1 - Math.abs(index - BARS / 2) / (BARS / 2);
        gsap.fromTo(
          bar,
          { scaleY: 0.15 + centre * 0.1 },
          {
            scaleY: 0.35 + centre * 0.65,
            duration: 0.7 + (index % 5) * 0.12,
            delay: (index % 7) * 0.08,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          },
        );
      });
    }, element);
    return () => context.revert();
  }, []);

  return (
    <div ref={root} aria-hidden className="flex h-20 items-center justify-center gap-1">
      {Array.from({ length: BARS }, (_, index) => (
        <span
          key={index}
          data-bar
          className="h-full w-1 origin-center rounded-full bg-primary/40"
          style={{ transform: "scaleY(0.25)" }}
        />
      ))}
    </div>
  );
}
