"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { formatInr } from "@/lib/format";

gsap.registerPlugin(ScrollTrigger);

interface CountUpProps {
  value: number;
  kind?: "inr" | "int";
  className?: string;
}

function render(kind: "inr" | "int", amount: number): string {
  return kind === "inr" ? formatInr(amount) : String(Math.round(amount));
}

// Counts up with GSAP, for the plan hero total only (every other amount is shown at once).
// after that. With reduced motion it shows the final value at once.
export function CountUp({ value, kind = "int", className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(0);
  const seen = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const from = shown.current;
    shown.current = value;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.textContent = render(kind, value);
      return;
    }
    const counter = { amount: from };
    element.textContent = render(kind, from);
    const tween = gsap.to(counter, {
      amount: value,
      duration: 1.1,
      ease: "power2.out",
      paused: true,
      onUpdate: () => {
        element.textContent = render(kind, counter.amount);
      },
    });
    let trigger: ScrollTrigger | undefined;
    if (seen.current) tween.play();
    else {
      trigger = ScrollTrigger.create({
        trigger: element,
        start: "top 92%",
        once: true,
        onEnter: () => {
          seen.current = true;
          tween.play();
        },
      });
    }
    return () => {
      trigger?.kill();
      tween.kill();
      element.textContent = render(kind, value);
    };
  }, [value, kind]);

  return (
    <span ref={ref} className={className}>
      {render(kind, value)}
    </span>
  );
}
