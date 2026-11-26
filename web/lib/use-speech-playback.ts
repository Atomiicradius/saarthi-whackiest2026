"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { speak, voiceAvailable } from "@/lib/api";
import type { Locale } from "@/lib/i18n";

export interface SpeechPlayback {
  /** True while audio is being fetched or played. */
  active: boolean;
  /** True once the audio is actually playing (the guide is "speaking"). */
  speaking: boolean;
  /** Smoothed loudness, 0 to 1, from the audio itself. */
  level: number;
  /** True for 3 seconds after the voice could not be played. */
  failed: boolean;
  /** False when the voice is not available (mock mode). */
  available: boolean;
  toggle(text: string, lang: Locale): void;
  stop(): void;
}

const FAILURE_MS = 3000;
const SMOOTHING = 0.6; // how much of the previous level is kept each frame
const GAIN = 4; // speech RMS is small; this brings it to a useful 0 to 1

// Only one line plays at a time, across every speaker icon on the page.
let stopCurrent: (() => void) | null = null;

/**
 * Plays text through POST /voice/speak. The mouth level comes from a Web Audio AnalyserNode on the
 * audio that is actually playing. Called from a click, so browsers allow the audio to start.
 * Nothing here throws: any failure only sets `failed` for a short while.
 */
export function useSpeechPlayback(): SpeechPlayback {
  const [active, setActive] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [level, setLevel] = useState(0);
  const [failed, setFailed] = useState(false);
  const token = useRef(0);
  const cleanup = useRef<(() => void) | null>(null);
  const failTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const self = useRef<() => void>(() => undefined);

  const stop = useCallback(() => {
    token.current += 1;
    cleanup.current?.();
    cleanup.current = null;
    if (stopCurrent === self.current) stopCurrent = null;
    setActive(false);
    setSpeaking(false);
    setLevel(0);
  }, []);

  useEffect(() => {
    self.current = stop;
  }, [stop]);

  const fail = useCallback(() => {
    stop();
    setFailed(true);
    if (failTimer.current) clearTimeout(failTimer.current);
    failTimer.current = setTimeout(() => setFailed(false), FAILURE_MS);
  }, [stop]);

  const toggle = useCallback(
    (text: string, lang: Locale) => {
      if (!voiceAvailable) return;
      if (active) {
        stop();
        return;
      }
      stopCurrent?.();
      stopCurrent = self.current;
      const mine = ++token.current;
      setFailed(false);
      setActive(true);

      // Created inside the click so the browser lets it run.
      let context: AudioContext | null = null;
      try {
        context = new AudioContext();
        void context.resume().catch(() => undefined);
      } catch {
        context = null;
      }
      const audioContext = context;

      speak(text, lang)
        .then(async (blob) => {
          if (token.current !== mine) return;
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          let frame = 0;
          let smoothed = 0;
          cleanup.current = () => {
            cancelAnimationFrame(frame);
            audio.pause();
            // Detach before revoking, or the browser logs a failed load of the blob.
            audio.removeAttribute("src");
            audio.load();
            URL.revokeObjectURL(url);
            void audioContext?.close().catch(() => undefined);
          };
          audio.addEventListener("ended", () => {
            if (token.current === mine) stop();
          });
          audio.addEventListener("error", () => {
            if (token.current === mine) fail();
          });
          if (audioContext) {
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 512;
            audioContext.createMediaElementSource(audio).connect(analyser);
            analyser.connect(audioContext.destination);
            const samples = new Uint8Array(analyser.fftSize);
            const tick = () => {
              analyser.getByteTimeDomainData(samples);
              let sum = 0;
              for (const sample of samples) {
                const centred = (sample - 128) / 128;
                sum += centred * centred;
              }
              const target = Math.min(1, Math.sqrt(sum / samples.length) * GAIN);
              smoothed = smoothed * SMOOTHING + target * (1 - SMOOTHING);
              setLevel(smoothed);
              frame = requestAnimationFrame(tick);
            };
            frame = requestAnimationFrame(tick);
          }
          await audio.play();
          if (token.current === mine) setSpeaking(true);
        })
        .catch(() => {
          if (token.current === mine) fail();
        });
    },
    [active, fail, stop],
  );

  useEffect(
    () => () => {
      stop();
      if (failTimer.current) clearTimeout(failTimer.current);
    },
    [stop],
  );

  return { active, speaking, level, failed, available: voiceAvailable, toggle, stop };
}
