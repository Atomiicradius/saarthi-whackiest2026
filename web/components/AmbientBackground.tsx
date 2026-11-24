"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

// A dot grid lit by the cursor, with fireflies. One canvas, one loop (GSAP's ticker, which is a
// single requestAnimationFrame shared with the quickTo smoothing). It pauses while the tab is
// hidden. With reduced motion it draws the static grid once and nothing else.

const DOT_RADIUS = 1.3;
const LIT_RADIUS = 2.6;
const LIGHT_REACH = 220; // dots inside this distance are lit, grown and pushed
const PUSH = 8;
const GLOW_RADIUS = 260;
const GLOW_ALPHA = 0.18;
const FIREFLY_REACH = 160;
const IDLE_MS = 3000;

const DOT = { r: 207, g: 198, b: 180, a: 0.55 }; // #CFC6B4
const AMBER = { r: 232, g: 163, b: 61 }; // #E8A33D

interface Firefly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
}

const mix = (from: number, to: number, amount: number) => from + (to - from) * amount;

export function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const draw2d = context;

    let width = 0;
    let height = 0;
    let spacing = 28;
    let compact = false; // narrow or touch: bigger spacing, fewer fireflies, idle light only
    let fireflies: Firefly[] = [];
    const light = { x: 0, y: 0 };
    let moveQuickX: (value: number) => void = () => {};
    let moveQuickY: (value: number) => void = () => {};
    let lastMove = -Infinity;
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;

    function spawn(count: number): Firefly[] {
      return Array.from({ length: count }, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 8 + Math.random() * 10;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 2 + Math.random(),
          phase: Math.random() * Math.PI * 2,
        };
      });
    }

    function fit() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = Math.round(width * ratio);
      canvas!.height = Math.round(height * ratio);
      draw2d.setTransform(ratio, 0, 0, ratio, 0, 0);
      compact = width < 768 || window.matchMedia("(pointer: coarse)").matches;
      spacing = compact ? 36 : 28;
      if (!reduced) fireflies = spawn(compact ? 10 : 25);
    }

    // The batched grid: every dot in one path, optionally skipping the ones near the light.
    function gridPath(skipNear: boolean) {
      draw2d.beginPath();
      for (let y = spacing / 2; y < height + spacing; y += spacing) {
        for (let x = spacing / 2; x < width + spacing; x += spacing) {
          if (skipNear && Math.hypot(x - light.x, y - light.y) < LIGHT_REACH) continue;
          draw2d.moveTo(x + DOT_RADIUS, y);
          draw2d.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
        }
      }
      draw2d.fillStyle = `rgba(${DOT.r}, ${DOT.g}, ${DOT.b}, ${DOT.a})`;
      draw2d.fill();
    }

    function drawStatic() {
      draw2d.clearRect(0, 0, width, height);
      gridPath(false);
    }

    function drawLitDots() {
      for (let y = spacing / 2; y < height + spacing; y += spacing) {
        for (let x = spacing / 2; x < width + spacing; x += spacing) {
          const dx = x - light.x;
          const dy = y - light.y;
          const distance = Math.hypot(dx, dy);
          if (distance >= LIGHT_REACH) continue;
          const falloff = 1 - distance / LIGHT_REACH;
          const strength = falloff * falloff * (3 - 2 * falloff); // smoothstep
          const push = distance > 0 ? (PUSH * strength) / distance : 0;
          const radius = mix(DOT_RADIUS, LIT_RADIUS, strength);
          draw2d.beginPath();
          draw2d.arc(x + dx * push, y + dy * push, radius, 0, Math.PI * 2);
          draw2d.fillStyle = `rgba(${Math.round(mix(DOT.r, AMBER.r, strength))}, ${Math.round(
            mix(DOT.g, AMBER.g, strength),
          )}, ${Math.round(mix(DOT.b, AMBER.b, strength))}, ${mix(DOT.a, 1, strength).toFixed(3)})`;
          draw2d.fill();
        }
      }
    }

    function stepFireflies(seconds: number, now: number) {
      for (const fly of fireflies) {
        // Slow wander, plus a gentle pull toward the light when it is close.
        fly.vx += (Math.random() - 0.5) * 30 * seconds;
        fly.vy += (Math.random() - 0.5) * 30 * seconds;
        const dx = light.x - fly.x;
        const dy = light.y - fly.y;
        const distance = Math.hypot(dx, dy);
        const near = distance < FIREFLY_REACH ? 1 - distance / FIREFLY_REACH : 0;
        if (near > 0) {
          fly.vx += (dx / distance) * 70 * near * seconds;
          fly.vy += (dy / distance) * 70 * near * seconds;
        }
        const speed = Math.hypot(fly.vx, fly.vy);
        const limit = 18 + near * 60;
        if (speed > limit) {
          fly.vx *= limit / speed;
          fly.vy *= limit / speed;
        }
        fly.x = (fly.x + fly.vx * seconds + width + 20) % (width + 20);
        fly.y = (fly.y + fly.vy * seconds + height + 20) % (height + 20);
        drawFirefly(fly, near, now);
      }
    }

    function drawFirefly(fly: Firefly, near: number, now: number) {
      const twinkle = 0.55 + 0.25 * Math.sin(now * 1.2 + fly.phase);
      const alpha = Math.min(1, twinkle + near * 0.45);
      const glow = fly.radius * 5;
      const gradient = draw2d.createRadialGradient(fly.x, fly.y, 0, fly.x, fly.y, glow);
      gradient.addColorStop(0, `rgba(255, 214, 138, ${alpha})`);
      gradient.addColorStop(0.35, `rgba(${AMBER.r}, ${AMBER.g}, ${AMBER.b}, ${alpha * 0.45})`);
      gradient.addColorStop(1, `rgba(${AMBER.r}, ${AMBER.g}, ${AMBER.b}, 0)`);
      draw2d.fillStyle = gradient;
      draw2d.beginPath();
      draw2d.arc(fly.x, fly.y, glow, 0, Math.PI * 2);
      draw2d.fill();
      draw2d.fillStyle = `rgba(${AMBER.r}, ${AMBER.g}, ${AMBER.b}, ${Math.min(1, alpha + 0.2)})`;
      draw2d.beginPath();
      draw2d.arc(fly.x, fly.y, fly.radius, 0, Math.PI * 2);
      draw2d.fill();
    }

    function frame(timeSeconds: number, deltaMs: number) {
      const seconds = Math.min(deltaMs, 50) / 1000;
      // With no mouse for 3s (or on touch and narrow screens) the light follows a slow Lissajous path.
      const idle = compact || performance.now() - lastMove > IDLE_MS;
      if (idle) {
        moveQuickX(width / 2 + width * 0.34 * Math.sin(timeSeconds * 0.27));
        moveQuickY(height / 2 + height * 0.3 * Math.sin(timeSeconds * 0.41 + 1.3));
      }

      draw2d.clearRect(0, 0, width, height);
      const glow = draw2d.createRadialGradient(light.x, light.y, 0, light.x, light.y, GLOW_RADIUS);
      glow.addColorStop(0, `rgba(${AMBER.r}, ${AMBER.g}, ${AMBER.b}, ${GLOW_ALPHA})`);
      glow.addColorStop(1, `rgba(${AMBER.r}, ${AMBER.g}, ${AMBER.b}, 0)`);
      draw2d.fillStyle = glow;
      draw2d.fillRect(
        light.x - GLOW_RADIUS,
        light.y - GLOW_RADIUS,
        GLOW_RADIUS * 2,
        GLOW_RADIUS * 2,
      );

      gridPath(true);
      drawLitDots();
      stepFireflies(seconds, timeSeconds);
    }

    fit();

    if (reduced) {
      drawStatic();
      const onResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          fit();
          drawStatic();
        }, 150);
      };
      window.addEventListener("resize", onResize);
      return () => {
        clearTimeout(resizeTimer);
        window.removeEventListener("resize", onResize);
      };
    }

    light.x = width / 2;
    light.y = height / 2;
    moveQuickX = gsap.quickTo(light, "x", { duration: 0.25, ease: "power3" });
    moveQuickY = gsap.quickTo(light, "y", { duration: 0.25, ease: "power3" });

    const onMove = (event: PointerEvent) => {
      if (compact || event.pointerType === "touch") return;
      lastMove = performance.now();
      moveQuickX(event.clientX);
      moveQuickY(event.clientY);
    };
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(fit, 150);
    };
    const start = () => gsap.ticker.add(frame);
    const onVisibility = () => (document.hidden ? gsap.ticker.remove(frame) : start());

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    if (!document.hidden) start();

    return () => {
      clearTimeout(resizeTimer);
      gsap.ticker.remove(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      gsap.killTweensOf(light);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 size-full"
    />
  );
}
