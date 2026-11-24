"use client";

import { useEffect, useId, useRef } from "react";
import gsap from "gsap";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

export type GuideState = "idle" | "listening" | "thinking" | "speaking" | "happy" | "concerned";

interface GuideProps {
  state?: GuideState;
  /** 0 closed .. 1 wide open. Only used while state is "speaking". Simulated until real audio exists. */
  mouthLevel?: number;
  className?: string;
}

const LOOK_RANGE = 4; // how far the pupils may move, in SVG units

// An original character: a small lantern spirit with a teal body and an amber glow on top.
export function Guide({ state = "idle", mouthLevel = 0, className }: GuideProps) {
  const svg = useRef<SVGSVGElement>(null);
  const reduced = usePrefersReducedMotion();
  const ids = useId();
  const glowId = `${ids}-glow`;
  const bodyId = `${ids}-body`;

  // Always-on life: breathing, blinking, a gentle glow and eyes that follow the cursor.
  useEffect(() => {
    const root = svg.current;
    if (!root || reduced) return;

    const context = gsap.context(() => {
      gsap.to("[data-body]", {
        scaleY: 1.025,
        scaleX: 0.99,
        duration: 2.2,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        transformOrigin: "50% 100%",
      });
      gsap.to("[data-glow]", {
        scale: 1.08,
        opacity: 0.85,
        duration: 1.8,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        transformOrigin: "50% 50%",
      });
      // Three blinks at uneven gaps so it does not look mechanical.
      gsap
        .timeline({ repeat: -1, repeatDelay: 1.6 })
        .to("[data-eye]", { scaleY: 0.08, duration: 0.07, yoyo: true, repeat: 1 }, 0)
        .to("[data-eye]", { scaleY: 0.08, duration: 0.07, yoyo: true, repeat: 1 }, 3.1)
        .to("[data-eye]", { scaleY: 0.08, duration: 0.07, yoyo: true, repeat: 1 }, 4.4);
    }, root);

    const followers = gsap.utils.toArray<SVGElement>("[data-follow]", root);
    const toX = gsap.quickTo(followers, "x", { duration: 0.35, ease: "power3" });
    const toY = gsap.quickTo(followers, "y", { duration: 0.35, ease: "power3" });
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const box = root.getBoundingClientRect();
      const dx = event.clientX - (box.left + box.width / 2);
      const dy = event.clientY - (box.top + box.height * 0.53);
      const distance = Math.hypot(dx, dy) || 1;
      const reach = Math.min(1, distance / 260);
      toX((dx / distance) * LOOK_RANGE * reach);
      toY((dy / distance) * LOOK_RANGE * reach);
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      context.revert();
    };
  }, [reduced]);

  // Pose for the current state. With reduced motion the pose is set at once, nothing loops.
  useEffect(() => {
    const root = svg.current;
    if (!root) return;

    const context = gsap.context(() => {
      const move = (target: string, vars: gsap.TweenVars) =>
        reduced
          ? gsap.set(target, vars)
          : gsap.to(target, { duration: 0.4, ease: "power2.out", overwrite: "auto", ...vars });

      move("[data-root]", { y: 0, rotation: 0, scale: 1, transformOrigin: "50% 100%" });
      move("[data-eyes]", { scale: 1, transformOrigin: "50% 50%" });
      move("[data-look]", { x: 0, y: 0 });
      move("[data-smile]", { opacity: 1, scaleY: 1, transformOrigin: "50% 0%" });
      move("[data-open]", { opacity: 0, scaleY: 0.1, transformOrigin: "50% 50%" });
      move("[data-ring]", { opacity: 0, scale: 1, transformOrigin: "50% 50%" });

      if (state === "listening") {
        move("[data-root]", { y: 3, scale: 1.05 });
        move("[data-eyes]", { scale: 1.12 });
        move("[data-smile]", { scaleY: 0.5 });
        if (reduced) gsap.set("[data-ring]", { opacity: 0.5 });
        else {
          gsap.fromTo(
            "[data-ring]",
            { scale: 0.85, opacity: 0.7 },
            { scale: 1.2, opacity: 0, duration: 1.3, ease: "power1.out", repeat: -1 },
          );
        }
      } else if (state === "thinking") {
        move("[data-smile]", { scaleY: 0.15 });
        if (!reduced) {
          gsap
            .timeline({ repeat: -1 })
            .to("[data-look]", { x: -LOOK_RANGE, y: -3, duration: 0.5, ease: "power2.inOut" })
            .to("[data-look]", { x: LOOK_RANGE, y: -3, duration: 0.6, ease: "power2.inOut" })
            .to("[data-look]", { x: 2, y: 3, duration: 0.5, ease: "power2.inOut" })
            .to("[data-look]", { x: 0, y: 0, duration: 0.4, ease: "power2.inOut" });
          gsap.to("[data-flame]", {
            opacity: 0.55,
            scaleY: 0.8,
            duration: 0.12,
            repeat: -1,
            yoyo: true,
            transformOrigin: "50% 100%",
          });
        }
      } else if (state === "speaking") {
        move("[data-smile]", { opacity: 0 });
        move("[data-open]", { opacity: 1 });
      } else if (state === "happy") {
        move("[data-eyes]", { scaleY: 0.78 });
        move("[data-smile]", { scaleY: 1.6 });
        if (!reduced) {
          gsap
            .timeline()
            .to("[data-root]", { y: -22, duration: 0.22, ease: "power2.out" })
            .to("[data-root]", { y: 0, duration: 0.45, ease: "bounce.out" })
            .to("[data-root]", { y: -12, duration: 0.18, ease: "power2.out" })
            .to("[data-root]", { y: 0, duration: 0.35, ease: "bounce.out" });
        }
      } else if (state === "concerned") {
        move("[data-root]", { rotation: -6, y: 2 });
        move("[data-smile]", { scaleY: -0.7 });
        move("[data-look]", { y: 2 });
      }
    }, root);

    // Kill, do not revert: the next pose starts from where this one stopped.
    return () => context.kill();
  }, [state, reduced]);

  // Mouth opening while speaking.
  useEffect(() => {
    const root = svg.current;
    if (!root || state !== "speaking") return;
    const level = Math.min(1, Math.max(0, mouthLevel));
    const open = root.querySelector("[data-open]");
    if (!open) return;
    const scaleY = 0.1 + 0.9 * level;
    if (reduced) gsap.set(open, { scaleY });
    else gsap.to(open, { scaleY, duration: 0.06, overwrite: "auto" });
  }, [state, mouthLevel, reduced]);

  return (
    <svg
      ref={svg}
      viewBox="0 -24 200 264"
      role="img"
      aria-label="Your guide, a small lantern spirit"
      className={className}
    >
      <defs>
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffd58a" stopOpacity="0.95" />
          <stop offset="0.45" stopColor="#e8a33d" stopOpacity="0.5" />
          <stop offset="1" stopColor="#e8a33d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={bodyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f6f6a" />
          <stop offset="1" stopColor="#0f3d3e" />
        </linearGradient>
      </defs>

      <ellipse cx="100" cy="226" rx="46" ry="6" fill="#14213d" opacity="0.12" />
      <circle
        data-ring
        cx="100"
        cy="140"
        r="82"
        fill="none"
        stroke="#e8a33d"
        strokeWidth="4"
        opacity="0"
      />

      <g data-root>
        <circle data-glow cx="100" cy="50" r="48" fill={`url(#${glowId})`} />
        <path data-flame d="M100 34 C108 46 110 56 100 66 C90 56 92 46 100 34 Z" fill="#ffe3a8" />
        <path
          d="M84 70 Q100 34 116 70"
          fill="none"
          stroke="#e8a33d"
          strokeWidth="5"
          strokeLinecap="round"
        />

        <g data-body>
          <rect x="64" y="64" width="72" height="14" rx="7" fill="#0b2f30" />
          <path
            d="M62 86 Q62 72 76 72 H124 Q138 72 138 86 V176 Q138 206 100 206 Q62 206 62 176 Z"
            fill={`url(#${bodyId})`}
          />
          <ellipse cx="80" cy="112" rx="6" ry="22" fill="#ffffff" opacity="0.12" />
          <rect x="76" y="202" width="48" height="12" rx="6" fill="#0b2f30" />
          <ellipse cx="56" cy="150" rx="9" ry="12" fill="#1f6f6a" />
          <ellipse cx="144" cy="150" rx="9" ry="12" fill="#1f6f6a" />
          <circle cx="76" cy="148" r="7" fill="#e8a33d" opacity="0.35" />
          <circle cx="124" cy="148" r="7" fill="#e8a33d" opacity="0.35" />

          <g data-eyes>
            {[84, 116].map((x) => (
              <g key={x} data-eye>
                <ellipse cx={x} cy="126" rx="11" ry="13" fill="#fffdf8" />
                <g data-look>
                  <g data-follow>
                    <circle cx={x} cy="127" r="6" fill="#14213d" />
                    <circle cx={x + 2} cy="124" r="2" fill="#ffffff" />
                  </g>
                </g>
              </g>
            ))}
          </g>

          <g transform="translate(100 158)">
            <path
              data-smile
              d="M-14 0 Q0 12 14 0"
              fill="none"
              stroke="#fffdf8"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <ellipse data-open cx="0" cy="4" rx="9" ry="8" fill="#0b2f30" opacity="0" />
          </g>
        </g>
      </g>
    </svg>
  );
}
