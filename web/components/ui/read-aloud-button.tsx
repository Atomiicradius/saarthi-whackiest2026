"use client";

import { Volume2 } from "lucide-react";
import { readAloudProvider } from "@/lib/read-aloud";
import { useSession } from "@/lib/session";

// Speaker icon for chat messages. It stays disabled until a ReadAloudProvider is wired in.
export function ReadAloudButton({ text }: { text: string }) {
  const { locale } = useSession();
  const provider = readAloudProvider;
  return (
    <button
      type="button"
      disabled={!provider}
      onClick={() => void provider?.speak(text, locale)}
      aria-label="Read aloud (coming soon)"
      title="Read aloud (coming soon)"
      className="inline-flex size-12 shrink-0 items-center justify-center rounded-full text-muted disabled:opacity-60"
    >
      <Volume2 className="size-5" aria-hidden />
    </button>
  );
}
