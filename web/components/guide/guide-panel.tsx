"use client";

import { useEffect, useState } from "react";
import { Guide, type GuideState } from "@/components/guide/guide";
import { MicButton } from "@/components/guide/mic-button";
import { SpeechBubble } from "@/components/guide/speech-bubble";
import { cn } from "@/lib/cn";
import { useSession } from "@/lib/session";
import { useSpeechPlayback } from "@/lib/use-speech-playback";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import type { MicState } from "@/lib/use-voice-answer";

interface GuidePanelProps {
  state: GuideState;
  message: string;
  /** "panel" stacks the guide above its bubble on desktop; "strip" is always one row. */
  variant?: "panel" | "strip";
  showMic?: boolean;
  /** Real voice input. Without it the mic only explains where voice answers are taken. */
  voice?: { state: MicState; onPress: () => void };
}

const LISTEN_MS = 2600;

export function GuidePanel({
  state,
  message,
  variant = "panel",
  showMic = false,
  voice,
}: GuidePanelProps) {
  const { t } = useSession();
  const playback = useSpeechPlayback();
  const reduced = usePrefersReducedMotion();
  const [listening, setListening] = useState(false);
  const stacked = variant === "panel";

  useEffect(() => {
    if (!listening) return;
    const timer = setTimeout(() => setListening(false), LISTEN_MS);
    return () => clearTimeout(timer);
  }, [listening]);

  // Without real voice input, pressing the mic says where voice answers can be given.
  const recording = voice?.state === "recording";
  const shownState: GuideState =
    listening || recording ? "listening" : playback.speaking ? "speaking" : state;
  // With reduced motion the mouth stays open while speaking instead of moving.
  const mouthLevel = reduced ? 0.5 : playback.level;
  const shownMessage = recording
    ? t("voice.listening")
    : listening
      ? t("interview.micSoon")
      : message;

  return (
    <section
      aria-label={t("guide.label")}
      className={cn("flex items-start gap-3", stacked && "lg:flex-col lg:items-stretch lg:gap-4")}
    >
      <Guide
        state={shownState}
        mouthLevel={mouthLevel}
        className={cn("w-24 shrink-0 sm:w-28", stacked ? "lg:mx-auto lg:w-56" : "lg:w-32")}
      />
      <div className="min-w-0 flex-1 space-y-3">
        <SpeechBubble text={shownMessage} stacked={stacked} playback={playback} />
        {showMic && (
          <div className={cn(stacked && "lg:flex lg:justify-center")}>
            {voice ? (
              <MicButton state={voice.state} onPress={voice.onPress} />
            ) : (
              <MicButton state="idle" onPress={() => setListening(true)} />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
