"use client";

import { Volume2 } from "lucide-react";
import { readAloudProvider } from "@/lib/read-aloud";
import { useSession } from "@/lib/session";

// Speaker icon for chat messages. Disabled when voice is not available (mocks on).
export function ReadAloudButton({ text }: { text: string }) {
  const { locale, t } = useSession();
  const provider = readAloudProvider;
  const label = provider ? t("voice.readAloud") : t("voice.readAloudSoon");
  return (
    <button
      type="button"
      disabled={!provider}
      onClick={() => void provider?.speak(text, locale).catch(() => undefined)}
      aria-label={label}
      title={label}
      className="inline-flex size-12 shrink-0 items-center justify-center rounded-full text-muted hover:text-primary disabled:opacity-60"
    >
      <Volume2 className="size-5" aria-hidden />
    </button>
  );
}
