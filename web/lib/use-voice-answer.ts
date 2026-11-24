"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { extractSlots, transcribe, voiceAvailable } from "@/lib/api";
import type { Locale } from "@/lib/i18n";
import type { FieldValue, ProfileFieldName } from "@/lib/types";

export type MicState = "idle" | "recording" | "working";

// What the guide should say after an attempt. `key` is an i18n path under "voice".
export interface VoiceNote {
  key: "heard" | "notUnderstood" | "denied" | "failed";
  heard?: string;
}

// Long enough for one answer; a student who forgets to press stop is not left recording.
const MAX_RECORDING_MS = 10_000;

/**
 * Speak-to-answer for one interview question: record, POST /voice/transcribe, then
 * POST /slots/extract for the field being asked. A value found for that field is handed to
 * `onValue`, which proposes it, so the student still confirms it in the read-back.
 * The audio stays in memory and is dropped as soon as it has been sent.
 */
export function useVoiceAnswer(
  field: ProfileFieldName | null,
  lang: Locale,
  onValue: (field: ProfileFieldName, value: FieldValue) => void,
) {
  const [state, setState] = useState<MicState>("idle");
  // Each note remembers its question, so moving on hides it without an effect.
  const [note, setNote] = useState<(VoiceNote & { field: ProfileFieldName }) | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const release = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    recorder.current?.stream.getTracks().forEach((track) => track.stop());
    recorder.current = null;
  }, []);

  useEffect(() => release, [release]);

  const handle = useCallback(
    async (audio: Blob, asked: ProfileFieldName) => {
      setState("working");
      try {
        const text = await transcribe(audio, lang);
        const candidates = text.trim() ? await extractSlots(text, asked, lang) : [];
        const hit = candidates.find((candidate) => candidate.field === asked);
        if (hit) {
          onValue(asked, hit.value);
          setNote({ key: "heard", heard: text, field: asked });
        } else {
          setNote({ key: "notUnderstood", heard: text, field: asked });
        }
      } catch {
        setNote({ key: "failed", field: asked });
      } finally {
        setState("idle");
      }
    },
    [lang, onValue],
  );

  const press = useCallback(async () => {
    if (state === "recording") {
      recorder.current?.stop();
      return;
    }
    if (state !== "idle" || !field) return;
    const asked = field;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setNote({ key: "denied", field: asked });
      return;
    }
    const chunks: Blob[] = [];
    const media = new MediaRecorder(stream);
    media.addEventListener("dataavailable", (event) => chunks.push(event.data));
    media.addEventListener("stop", () => {
      const audio = new Blob(chunks, { type: media.mimeType });
      release();
      void handle(audio, asked);
    });
    recorder.current = media;
    setNote(null);
    setState("recording");
    media.start();
    timer.current = setTimeout(() => media.state === "recording" && media.stop(), MAX_RECORDING_MS);
  }, [field, handle, release, state]);

  return {
    available: voiceAvailable && field !== null,
    state,
    note: note && note.field === field ? note : null,
    press,
  };
}
