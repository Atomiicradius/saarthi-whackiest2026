"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import gsap from "gsap";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

const FINE_POINTER = "(hover: hover) and (pointer: fine)";
const INTERACTIVE = "a, button, [role='button'], summary, select, label, [data-flame-grow]";
const TEXT_FIELD =
  "input:not([type='checkbox']):not([type='radio']):not([type='button']):not([type='submit']), textarea, [contenteditable='true'], [data-native-cursor]";

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(FINE_POINTER);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

// A small flame that replaces the pointer on desktop. Its tip sits on the real pointer position.
// Only transforms and opacity are animated, and nothing is measured per frame. The native cursor is
// hidden only through the html.flame-active class, which this component adds once it is running and
// removes when it stops, so a failure always leaves the normal cursor.
export function FlameCursor() {
  const reduced = usePrefersReducedMotion();
  const fine = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(FINE_POINTER).matches,
    () => false,
  );
  const follow = useRef<HTMLDivElement>(null);
  const grow = useRef<HTMLDivElement>(null);
  const enabled = fine && !reduced;

  useEffect(() => {
    const mover = follow.current;
    const scaler = grow.current;
    if (!enabled || !mover || !scaler) return;

    gsap.set(mover, { xPercent: -50, x: -100, y: -100, opacity: 0 });
    gsap.set(scaler, { transformOrigin: "50% 0%" });
    const toX = gsap.quickTo(mover, "x", { duration: 0.08, ease: "power3" });
    const toY = gsap.quickTo(mover, "y", { duration: 0.08, ease: "power3" });

    const context = gsap.context(() => {
      gsap.to("[data-flame-shape]", {
        scaleY: 1.1,
        skewX: 3,
        duration: 0.37,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        transformOrigin: "50% 100%",
      });
      gsap.to("[data-flame-inner]", {
        scaleY: 0.9,
        skewX: -4,
        duration: 0.53,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        transformOrigin: "50% 100%",
      });
      gsap.to("[data-flame-glow]", {
        opacity: 0.55,
        scale: 1.12,
        duration: 0.9,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        transformOrigin: "50% 50%",
      });
    }, mover);

    let visible = false;
    let over: "none" | "button" | "text" = "none";
    const show = (on: boolean) => {
      if (on === visible) return;
      visible = on;
      gsap.to(mover, { opacity: on ? 1 : 0, duration: 0.2, overwrite: "auto" });
    };
    const setOver = (next: typeof over) => {
      if (next === over) return;
      over = next;
      if (next === "text") {
        show(false);
        return;
      }
      gsap.to(scaler, { scale: next === "button" ? 1.25 : 1, duration: 0.18, overwrite: "auto" });
      gsap.to("[data-flame-glow]", { scale: next === "button" ? 1.5 : 1, duration: 0.18 });
      show(true);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      toX(event.clientX);
      toY(event.clientY);
      document.documentElement.classList.add("flame-active");
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest(TEXT_FIELD)) setOver("text");
      else {
        setOver(target?.closest(INTERACTIVE) ? "button" : "none");
        show(true);
      }
    };
    const onDown = () => {
      if (over === "text") return;
      gsap.fromTo(
        scaler,
        { scaleY: 0.78, scaleX: 1.12 },
        { scaleY: 1, scaleX: 1, duration: 0.25, ease: "back.out(3)", overwrite: "auto" },
      );
    };
    const onLeave = () => show(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.classList.remove("flame-active");
      context.revert();
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={follow}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[100] will-change-transform"
    >
      <div ref={grow}>
        <svg width="14" height="36" viewBox="0 0 14 36" overflow="visible">
          <defs>
            <radialGradient id="flame-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#ffd58a" stopOpacity="0.7" />
              <stop offset="1" stopColor="#e8a33d" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle data-flame-glow cx="7" cy="12" r="15" fill="url(#flame-glow)" />
          <path
            data-flame-shape
            d="M7 0 C11 6 13 11 11 16 C10 19 8.5 20 7 20 C5.5 20 4 19 3 16 C1 11 3 6 7 0 Z"
            fill="#e8a33d"
          />
          <path
            data-flame-inner
            d="M7 8 C9 11 9.5 14 8.5 16.5 C8 17.8 7.5 18 7 18 C6.5 18 6 17.8 5.5 16.5 C4.5 14 5 11 7 8 Z"
            fill="#fff3d6"
          />
          <rect x="6.4" y="19.5" width="1.2" height="3" rx="0.6" fill="#14213d" />
          <rect x="4" y="22" width="6" height="13" rx="2" fill="#0f3d3e" />
        </svg>
      </div>
    </div>
  );
}
