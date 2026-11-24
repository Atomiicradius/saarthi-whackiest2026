import { speak, voiceAvailable } from "@/lib/api";
import type { Locale } from "@/lib/i18n";

// Speaker icon on chat messages: plays the text through POST /voice/speak (ElevenLabs, proxied by
// our API so the key stays on the server). Null when mocks are on, so the icon shows disabled.
export interface ReadAloudProvider {
  speak(text: string, lang: Locale): Promise<void>;
  stop(): void;
}

let playing: HTMLAudioElement | null = null;

function stop(): void {
  if (!playing) return;
  playing.pause();
  URL.revokeObjectURL(playing.src);
  playing = null;
}

async function speakAloud(text: string, lang: Locale): Promise<void> {
  stop();
  const audio = new Audio(URL.createObjectURL(await speak(text, lang)));
  playing = audio;
  audio.addEventListener("ended", () => {
    if (playing === audio) stop();
  });
  await audio.play();
}

export const readAloudProvider: ReadAloudProvider | null = voiceAvailable
  ? { speak: speakAloud, stop }
  : null;
