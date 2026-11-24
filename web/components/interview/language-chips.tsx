"use client";

import { LANGUAGE_CHIPS } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { useSession } from "@/lib/session";

export function LanguageChips() {
  const { locale, setLocale, t } = useSession();
  return (
    <div>
      <div role="group" aria-label={t("lang.label")} className="flex flex-wrap gap-2">
        {LANGUAGE_CHIPS.map((chip) => (
          <button
            key={chip.locale}
            type="button"
            lang={chip.locale}
            aria-pressed={locale === chip.locale}
            onClick={() => setLocale(chip.locale)}
            className={cn(
              "min-h-12 rounded-full border px-5 text-base font-semibold",
              locale === chip.locale
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-ink",
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>
      {locale !== "en" && <p className="mt-2 text-xs text-muted">{t("lang.fallbackNote")}</p>}
    </div>
  );
}
