"use client";

import { Mic } from "lucide-react";
import { useSession } from "@/lib/session";

// PLACEHOLDER: voice input is not built yet. Pressing it only makes the guide look as if it is
// listening for a moment and says so. The real handler (ElevenLabs speech-to-text) goes here later.
export function MicButton({ onPress }: { onPress: () => void }) {
  const { t } = useSession();
  return (
    <button
      type="button"
      onClick={onPress}
      className="inline-flex min-h-12 items-center gap-2 rounded-full border border-border bg-surface px-5 text-sm font-semibold text-ink"
    >
      <Mic className="size-5 text-primary" aria-hidden />
      {t("interview.mic")}
    </button>
  );
}
