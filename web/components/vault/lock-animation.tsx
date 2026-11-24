"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Lock, LockOpen } from "lucide-react";

// Plays once when it mounts: the open padlock shuts and a ring ripples out.
export function LockAnimation() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const open = element.querySelector<HTMLElement>("[data-open]");
    const shut = element.querySelector<HTMLElement>("[data-shut]");
    const ring = element.querySelector<HTMLElement>("[data-ring]");
    if (!open || !shut || !ring) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(open, { opacity: 0 });
      gsap.set(shut, { opacity: 1 });
      return;
    }
    const context = gsap.context(() => {
      gsap
        .timeline()
        .set(shut, { opacity: 0, scale: 1.5 })
        .to(open, { opacity: 0, scale: 0.6, duration: 0.25, delay: 0.7 })
        .to(shut, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2.5)" }, "<")
        .fromTo(
          ring,
          { scale: 0.8, opacity: 0.5 },
          { scale: 2, opacity: 0, duration: 0.7, ease: "power1.out" },
          "<0.1",
        );
    }, element);
    return () => context.revert();
  }, []);

  return (
    <div ref={root} className="relative flex size-16 items-center justify-center" aria-hidden>
      <span data-ring className="absolute inset-0 rounded-full bg-primary/30 opacity-0" />
      <span className="absolute inset-0 rounded-full bg-primary/10" />
      <LockOpen data-open className="absolute size-8 text-primary" />
      <Lock data-shut className="absolute size-8 text-primary" />
    </div>
  );
}
