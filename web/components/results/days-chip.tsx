import { Clock } from "lucide-react";
import { Chip, type ChipTone } from "@/components/ui/chip";
import { urgencyOf } from "@/lib/dates";
import { formatDate, monthOf } from "@/lib/format";
import type { Scheme } from "@/lib/types";

const URGENCY_TONE: Record<string, ChipTone> = {
  soon: "danger",
  month: "amber",
  later: "success",
};

interface DaysChipProps {
  scheme: Scheme;
  t: (path: string, vars?: Record<string, string | number>) => string;
}

// Colour-coded days left. A closed scheme always reads "Closed, opens around <month>".
export function DaysChip({ scheme, t }: DaysChipProps) {
  const appWindow = scheme.application_window;
  const { urgency, days } = urgencyOf(scheme);

  if (urgency === "closed") {
    const month = appWindow ? monthOf(appWindow.opens) : "";
    return (
      <Chip tone="neutral">
        <Clock className="size-3.5" aria-hidden />
        {month ? t("results.status.closed", { month }) : t("results.status.unknown")}
      </Chip>
    );
  }
  if (appWindow?.status === "upcoming") {
    return (
      <Chip tone="neutral">{t("results.status.opens", { date: formatDate(appWindow.opens) })}</Chip>
    );
  }
  if (urgency === "unknown" || days === null) {
    return <Chip tone="neutral">{t("results.status.unknown")}</Chip>;
  }
  return (
    <Chip tone={URGENCY_TONE[urgency]}>
      <Clock className="size-3.5" aria-hidden />
      {days === 1 ? "1 day left" : `${days} days left`}
    </Chip>
  );
}
