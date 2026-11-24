"use client";

import { useEffect, useState } from "react";
import { Guide, type GuideState } from "@/components/guide/guide";
import { MicButton } from "@/components/guide/mic-button";
import { SpeechBubble } from "@/components/guide/speech-bubble";
import { cn } from "@/lib/cn";
import { useSession } from "@/lib/session";

interface GuidePanelProps {
  state: GuideState;
  message: string;
  /** "panel" stacks the guide above its bubble on desktop; "strip" is always one row. */
  variant?: "panel" | "strip";
  showMic?: boolean;
}

const LISTEN_MS = 2600;

export function GuidePanel({
  state,
  message,
  variant = "panel",
  showMic = false,
}: GuidePanelProps) {
  const { t } = useSession();
  const [listening, setListening] = useState(false);
  const stacked = variant === "panel";

  useEffect(() => {
    if (!listening) return;
    const timer = setTimeout(() => setListening(false), LISTEN_MS);
    return () => clearTimeout(timer);
  }, [listening]);

  // While "listening", the guide says plainly that voice is not available yet.
  const shownState: GuideState = listening ? "listening" : state;
  const shownMessage = listening ? t("interview.micSoon") : message;

  return (
    <section
      aria-label={t("guide.label")}
      className={cn("flex items-start gap-3", stacked && "lg:flex-col lg:items-stretch lg:gap-4")}
    >
      <Guide
        state={shownState}
        className={cn("w-24 shrink-0 sm:w-28", stacked ? "lg:mx-auto lg:w-56" : "lg:w-32")}
      />
      <div className="min-w-0 flex-1 space-y-3">
        <SpeechBubble text={shownMessage} stacked={stacked} />
        {showMic && (
          <div className={cn(stacked && "lg:flex lg:justify-center")}>
            <MicButton onPress={() => setListening(true)} />
          </div>
        )}
      </div>
    </section>
  );
}
