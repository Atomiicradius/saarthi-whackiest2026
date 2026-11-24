"use client";

import { useEffect, useState } from "react";
import gsap from "gsap";
import { ReadAloudButton } from "@/components/ui/read-aloud-button";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

interface SpeechBubbleProps {
  text: string;
  /** Tail points up (stacked panel on desktop) instead of left. */
  stacked?: boolean;
}

// The guide's words, typed out. The full text is always in the DOM for screen readers and to
// keep the bubble from changing size while it types. No audio is played.
export function SpeechBubble({ text, stacked = false }: SpeechBubbleProps) {
  const reduced = usePrefersReducedMotion();
  const [typed, setTyped] = useState({ text: "", count: 0 });

  useEffect(() => {
    if (reduced) return;
    const progress = { count: 0 };
    const tween = gsap.to(progress, {
      count: text.length,
      duration: Math.max(0.4, text.length * 0.022),
      ease: "none",
      onUpdate: () => setTyped({ text, count: Math.floor(progress.count) }),
    });
    return () => {
      tween.kill();
    };
  }, [text, reduced]);

  const shown = reduced ? text : typed.text === text ? text.slice(0, typed.count) : "";

  return (
    <div className="relative">
      <span
        aria-hidden
        className={cn(
          "absolute size-3 rotate-45 border-b border-l border-border bg-surface",
          "left-[-7px] top-7",
          stacked && "lg:left-1/2 lg:top-[-7px] lg:-translate-x-1/2 lg:border-b-0 lg:border-t",
        )}
      />
      <div className="relative flex items-start gap-1 rounded-3xl border border-border bg-surface p-4 shadow-[0_8px_24px_-14px_rgba(20,33,61,0.2)]">
        <div className="min-w-0 flex-1 font-serif text-lg leading-snug lg:text-xl">
          <span className="sr-only" role="status">
            {text}
          </span>
          <p aria-hidden className="invisible">
            {text}
          </p>
          <p aria-hidden className="pointer-events-none absolute inset-0 p-4 pr-14">
            {shown}
          </p>
        </div>
        <ReadAloudButton text={text} />
      </div>
    </div>
  );
}
