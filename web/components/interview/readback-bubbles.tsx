"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { ReadAloudButton } from "@/components/ui/read-aloud-button";
import { useSession } from "@/lib/session";

interface ReadbackBubblesProps {
  answerText: string;
  readbackText: string;
  onYes: () => void;
  onChange: () => void;
}

// Chat-style read-back: the student's answer on the right, Saarthi's "correct?" on the left.
export function ReadbackBubbles({
  answerText,
  readbackText,
  onYes,
  onChange,
}: ReadbackBubblesProps) {
  const { t } = useSession();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.from("[data-bubble]", {
        opacity: 0,
        y: 12,
        duration: 0.4,
        stagger: 0.25,
        ease: "power2.out",
      });
    }, element);
    return () => context.revert();
  }, []);

  return (
    <div ref={root} className="space-y-3" aria-live="polite">
      <div data-bubble className="flex justify-end">
        <p className="max-w-[80%] rounded-3xl rounded-br-md bg-primary px-4 py-3 text-base text-white">
          {answerText}
        </p>
      </div>
      <div data-bubble className="flex items-start gap-1">
        <div className="max-w-[85%] rounded-3xl rounded-bl-md border border-border bg-surface px-4 py-3">
          <p className="text-base font-semibold">{readbackText}</p>
          <div className="mt-3 flex gap-2">
            <Button onClick={onYes}>{t("interview.yes")}</Button>
            <Button variant="secondary" onClick={onChange}>
              {t("interview.change")}
            </Button>
          </div>
        </div>
        <ReadAloudButton text={readbackText} />
      </div>
    </div>
  );
}
