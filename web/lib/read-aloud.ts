import type { Locale } from "@/lib/i18n";

// Typed stub for the speaker icon on chat messages. Voice output (ElevenLabs via POST
// /voice/speak) is not built yet; the icon is shown disabled until a provider is wired in.
export interface ReadAloudProvider {
  speak(text: string, lang: Locale): Promise<void>;
  stop(): void;
}

export const readAloudProvider: ReadAloudProvider | null = null;
