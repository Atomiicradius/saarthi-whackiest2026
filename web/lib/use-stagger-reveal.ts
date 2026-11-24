"use client";

import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";

// Fades and lifts every child marked data-reveal, one after another. Skipped with reduced motion.
export function useStaggerReveal(container: RefObject<HTMLElement | null>, ready: boolean) {
  useLayoutEffect(() => {
    const root = container.current;
    if (!root || !ready) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.from("[data-reveal]", {
        opacity: 0,
        y: 16,
        duration: 0.5,
        ease: "power2.out",
        stagger: 0.07,
        clearProps: "opacity,transform",
      });
    }, root);
    return () => context.revert();
  }, [container, ready]);
}
