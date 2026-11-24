"use client";

import { LoaderCircle, Mic, Square } from "lucide-react";
import { cn } from "@/lib/cn";
import { useSession } from "@/lib/session";
import type { MicState } from "@/lib/use-voice-answer";

// Press to record an answer, press again to stop. Tapping an answer always works as well.
export function MicButton({ state, onPress }: { state: MicState; onPress: () => void }) {
  const { t } = useSession();
  const recording = state === "recording";
  const working = state === "working";
  const Icon = working ? LoaderCircle : recording ? Square : Mic;
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={working}
      aria-pressed={recording}
      className={cn(
        "inline-flex min-h-12 items-center gap-2 rounded-full border px-5 text-sm font-semibold",
        recording
          ? "border-danger bg-danger text-white"
          : "border-border bg-surface text-ink hover:border-primary",
        working && "opacity-80",
      )}
    >
      <Icon
        className={cn("size-5", !recording && "text-primary", working && "animate-spin")}
        aria-hidden
      />
      {working ? t("voice.working") : recording ? t("voice.stop") : t("interview.mic")}
    </button>
  );
}
