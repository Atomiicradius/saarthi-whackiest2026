"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Mic } from "lucide-react";
import { useSession } from "@/lib/session";

// PLACEHOLDER: voice input is not built yet. The orb only plays its listening pulse for a moment
// and says so. The real mic handler (ElevenLabs speech-to-text) replaces onTap later.
export function MicOrb({ size = "md" }: { size?: "md" | "lg" }) {
  const { t } = useSession();
  const dim = size === "lg" ? "size-28" : "size-20";
  const [listening, setListening] = useState(false);
  const orb = useRef<HTMLButtonElement>(null);
  const rings = useRef<HTMLSpanElement>(null);

  // Idle breathing, and the stronger pulse while "listening". Both are skipped for reduced motion.
  useEffect(() => {
    const root = orb.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.to(root, {
        scale: listening ? 1.08 : 1.03,
        duration: listening ? 0.6 : 1.8,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
      if (listening && rings.current) {
        gsap.fromTo(
          rings.current.children,
          { scale: 1, opacity: 0.45 },
          { scale: 2.1, opacity: 0, duration: 1.4, ease: "power1.out", repeat: -1, stagger: 0.45 },
        );
      }
    });
    return () => context.revert();
  }, [listening]);

  useEffect(() => {
    if (!listening) return;
    const timer = setTimeout(() => setListening(false), 2500);
    return () => clearTimeout(timer);
  }, [listening]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative flex ${dim} items-center justify-center`}>
        <span ref={rings} className="pointer-events-none absolute inset-0" aria-hidden>
          <span className="absolute inset-0 rounded-full bg-primary/30" />
          <span className="absolute inset-0 rounded-full bg-amber/40" />
        </span>
        <button
          ref={orb}
          type="button"
          onClick={() => setListening(true)}
          aria-label={t("interview.mic")}
          className={`relative flex ${dim} items-center justify-center rounded-full text-white shadow-[0_8px_24px_rgba(15,61,62,0.35)]`}
          style={{
            background:
              "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.55), rgba(255,255,255,0) 38%), linear-gradient(145deg, #0f3d3e 10%, #1f6f6a 55%, #e8a33d 115%)",
          }}
        >
          <Mic className={size === "lg" ? "size-12" : "size-8"} aria-hidden />
        </button>
      </div>
      <p role="status" className="min-h-5 text-center text-xs text-muted">
        {listening ? t("interview.micSoon") : ""}
      </p>
    </div>
  );
}
