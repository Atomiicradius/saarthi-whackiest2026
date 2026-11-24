import { ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { Scheme } from "@/lib/types";

interface SourceChipProps {
  scheme: Scheme;
  t: (path: string, vars?: Record<string, string | number>) => string;
}

export function SourceChip({ scheme, t }: SourceChipProps) {
  return (
    <a
      href={scheme.source_url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-12 items-center gap-2 rounded-full border border-border bg-bg px-4 text-xs font-semibold text-ink"
    >
      <ExternalLink className="size-3.5" aria-hidden />
      {t("results.source")} · {t("results.verified", { date: formatDate(scheme.last_verified) })}
    </a>
  );
}
