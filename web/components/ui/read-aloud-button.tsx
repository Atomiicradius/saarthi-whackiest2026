"use client";

import { useEffect } from "react";
import { Square, Volume2 } from "lucide-react";
import { useSession } from "@/lib/session";
import { useSpeechPlayback, type SpeechPlayback } from "@/lib/use-speech-playback";

interface ReadAloudButtonProps {
  text: string;
  /** The guide's playback, so the guide can speak. Without it the button plays on its own. */
  playback?: SpeechPlayback;
}

// Speaker icon for chat messages. Plays the same text the bubble shows. Click again to stop.
// Disabled when voice is not available (mocks on).
export function ReadAloudButton({ text, playback }: ReadAloudButtonProps) {
  const { locale, t } = useSession();
  const own = useSpeechPlayback();
  const speech = playback ?? own;
  const { stop } = speech;
  const label = !speech.available
    ? t("voice.readAloudSoon")
    : speech.active
      ? t("voice.stopReading")
      : t("voice.readAloud");

  // A new line replaces the old one, so stop what was playing.
  useEffect(() => stop, [text, stop]);

  const Icon = speech.active ? Square : Volume2;
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        disabled={!speech.available}
        onClick={() => speech.toggle(text, locale)}
        aria-label={label}
        aria-pressed={speech.active}
        title={label}
        className="inline-flex size-12 items-center justify-center rounded-full text-muted hover:text-primary disabled:opacity-60"
      >
        <Icon className="size-5" aria-hidden />
      </button>
      {speech.failed && !playback && (
        <p
          role="status"
          className="absolute right-0 top-full z-10 mt-1 w-max max-w-48 text-right text-xs text-muted"
        >
          {t("voice.unavailable")}
        </p>
      )}
    </div>
  );
}
