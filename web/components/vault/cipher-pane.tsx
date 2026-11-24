"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { useSession } from "@/lib/session";

const SHOWN_CHARS = 1600;

function base64ToHex(text: string): string {
  const raw = atob(text);
  let hex = "";
  for (let i = 0; i < raw.length; i += 1) hex += raw.charCodeAt(i).toString(16).padStart(2, "0");
  // Groups of 8 so the wall of bytes is easier to scan.
  return hex.replace(/(.{8})/g, "$1 ").trim();
}

// The ciphertext the server stores, in hex or base64, cut short with a scrollable monospace box.
export function CipherPane({ ciphertextBase64 }: { ciphertextBase64: string }) {
  const { t } = useSession();
  const [format, setFormat] = useState<"hex" | "base64">("hex");
  const text = useMemo(
    () => (format === "hex" ? base64ToHex(ciphertextBase64) : ciphertextBase64),
    [format, ciphertextBase64],
  );
  const hidden = Math.max(0, text.length - SHOWN_CHARS);

  return (
    <div className="space-y-3">
      <div role="group" aria-label="Format" className="flex gap-2">
        {(["hex", "base64"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={format === option}
            onClick={() => setFormat(option)}
            className={cn(
              "min-h-12 rounded-full border px-4 text-sm font-semibold",
              format === option
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-ink",
            )}
          >
            {t(`serverView.${option}`)}
          </button>
        ))}
      </div>
      <pre
        tabIndex={0}
        aria-label={t("serverView.onServer")}
        className="max-h-72 overflow-auto break-all whitespace-pre-wrap rounded-2xl bg-ink p-4 font-mono text-xs leading-relaxed text-white/90"
      >
        {text.slice(0, SHOWN_CHARS)}
        {hidden > 0 && `\n${t("serverView.moreBytes", { count: hidden })}`}
      </pre>
    </div>
  );
}
