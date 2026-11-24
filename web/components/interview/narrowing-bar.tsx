"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { CountUp } from "@/components/ui/count-up";

interface NarrowingBarProps {
  total: number;
  remaining: number;
  label: string;
  caption: string;
}

// "31 schemes -> 9 still possible". The fill shrinks as answers narrow the list.
export function NarrowingBar({ total, remaining, label, caption }: NarrowingBarProps) {
  const fill = useRef<HTMLDivElement>(null);
  const percent = total === 0 ? 0 : Math.max(4, Math.round((remaining / total) * 100));

  useEffect(() => {
    const element = fill.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.style.width = `${percent}%`;
      return;
    }
    const tween = gsap.to(element, { width: `${percent}%`, duration: 0.7, ease: "power2.out" });
    return () => {
      tween.kill();
    };
  }, [percent]);

  return (
    <div className="rounded-3xl border border-border bg-surface p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold">{label}</p>
        <p className="font-serif text-2xl font-semibold text-primary">
          <CountUp value={remaining} />
          <span className="text-sm font-normal text-muted"> / {total}</span>
        </p>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={remaining}
        className="mt-2 h-3 overflow-hidden rounded-full bg-border"
      >
        <div
          ref={fill}
          className="h-full rounded-full bg-primary"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted">{caption}</p>
    </div>
  );
}
