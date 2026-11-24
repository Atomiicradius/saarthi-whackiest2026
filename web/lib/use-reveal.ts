"use client";

import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Fades every [data-reveal] child up by 24px as it scrolls into view, once. Items that enter
// together are staggered. The hidden start state is applied by GSAP, never by CSS, so content
// stays visible if scripts fail. With reduced motion nothing is touched.
export function useReveal(container: RefObject<HTMLElement | null>, ready: boolean) {
  useLayoutEffect(() => {
    const root = container.current;
    if (!root || !ready) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = gsap.context(() => {
      const targets = gsap.utils.toArray<HTMLElement>("[data-reveal]", root);
      if (targets.length === 0) return;
      gsap.set(targets, { opacity: 0, y: 24 });
      const shown = new Set<HTMLElement>();
      const show = (items: HTMLElement[]) => {
        items.forEach((item) => shown.add(item));
        gsap.to(items, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.08,
          overwrite: true,
        });
      };
      ScrollTrigger.batch(targets, {
        start: "top 90%",
        once: true,
        onEnter: (batch) => show(batch as HTMLElement[]),
      });
      // Anything the batches could not reach (the last items at the very bottom) shows once the
      // bottom of the page is reached.
      ScrollTrigger.create({
        start: "max",
        once: true,
        onEnter: () => show(targets.filter((item) => !shown.has(item))),
      });
    }, root);

    // Positions changed because new content was added: measure again.
    ScrollTrigger.refresh();
    return () => context.revert();
  }, [container, ready]);
}
