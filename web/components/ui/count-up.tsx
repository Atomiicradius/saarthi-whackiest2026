"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { formatInr } from "@/lib/format";

interface CountUpProps {
  value: number;
  kind?: "inr" | "int";
  className?: string;
}

function render(kind: "inr" | "int", amount: number): string {
  return kind === "inr" ? formatInr(amount) : String(Math.round(amount));
}

// Counts from 0 to `value` with GSAP. With reduced motion it shows the final value at once.
export function CountUp({ value, kind = "int", className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  // Start from the last value shown, so a change animates from old to new (first mount: from 0).
  const shown = useRef(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = shown.current;
    shown.current = value;
    if (reduced) {
      element.textContent = render(kind, value);
      return;
    }
    const counter = { amount: from };
    const tween = gsap.to(counter, {
      amount: value,
      duration: 1.1,
      ease: "power2.out",
      onUpdate: () => {
        element.textContent = render(kind, counter.amount);
      },
    });
    return () => {
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
