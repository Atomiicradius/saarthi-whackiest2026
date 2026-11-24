"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

// Soft colour behind the content: three blobs that drift and lean slightly toward the cursor, plus
// faint grain. Colours are kept pale so text on the page background stays AA. It does nothing
// with reduced motion, pauses while the tab is hidden, and only drifts (slowly) on touch screens.
const BLOBS = [
  {
    colour: "rgba(15, 61, 62, 0.11)",
    size: "62vmax",
    left: "-18%",
    top: "-24%",
    depth: 40,
    drift: 70,
  },
  {
    colour: "rgba(232, 163, 61, 0.14)",
    size: "52vmax",
    left: "58%",
    top: "-8%",
    depth: 70,
    drift: 90,
  },
  {
    colour: "rgba(255, 255, 255, 0.9)",
    size: "56vmax",
    left: "24%",
    top: "52%",
    depth: 25,
    drift: 60,
  },
];

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function AmbientBackground() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const touch = window.matchMedia("(pointer: coarse)").matches;
    const speed = touch ? 2 : 1;

    const tweens: gsap.core.Tween[] = [];
    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-drift]", element).forEach((blob, index) => {
        const range = BLOBS[index].drift;
        tweens.push(
          gsap.to(blob, {
            x: () => gsap.utils.random(-range, range),
            y: () => gsap.utils.random(-range, range),
            duration: gsap.utils.random(16, 24) * speed,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
            repeatRefresh: true,
          }),
        );
      });
    }, element);

    // Lean toward the cursor with different depths, so the blobs separate a little.
    const wrappers = gsap.utils.toArray<HTMLElement>("[data-lean]", element);
    const movers = wrappers.map((wrapper, index) => ({
      x: gsap.quickTo(wrapper, "x", { duration: 1.4, ease: "power3" }),
      y: gsap.quickTo(wrapper, "y", { duration: 1.4, ease: "power3" }),
      depth: BLOBS[index].depth,
    }));
    const onMove = (event: PointerEvent) => {
      const nx = event.clientX / window.innerWidth - 0.5;
      const ny = event.clientY / window.innerHeight - 0.5;
      movers.forEach((mover) => {
        mover.x(nx * mover.depth);
        mover.y(ny * mover.depth);
      });
    };
    if (!touch) window.addEventListener("pointermove", onMove, { passive: true });

    const onVisibility = () =>
      tweens.forEach((tween) => (document.hidden ? tween.pause() : tween.resume()));
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
      context.revert();
    };
  }, []);

  return (
    <div ref={root} aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {BLOBS.map((blob) => (
        <div
          key={blob.colour}
          data-lean
          className="absolute"
          style={{ left: blob.left, top: blob.top }}
        >
          <div
            data-drift
            className="rounded-full will-change-transform"
            style={{
              width: blob.size,
              height: blob.size,
              background: `radial-gradient(closest-side, ${blob.colour}, transparent)`,
            }}
          />
        </div>
      ))}
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-multiply"
        style={{ backgroundImage: GRAIN }}
      />
    </div>
  );
}
