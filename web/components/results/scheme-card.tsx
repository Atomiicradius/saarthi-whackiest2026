import { Award, Check, CircleHelp, HeartHandshake, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Chip, type ChipTone } from "@/components/ui/chip";
import { DaysChip } from "@/components/results/days-chip";
import { HowToQualify } from "@/components/results/how-to-qualify";
import { SourceChip } from "@/components/results/source-chip";
import { reasonText } from "@/lib/reason-text";
import { formatDate, formatInr } from "@/lib/format";
import { closeDate } from "@/lib/dates";
import type { SchemeView } from "@/lib/results-model";
import type { ReasonStatus } from "@/lib/types";

type T = (path: string, vars?: Record<string, string | number>) => string;

const REASON_ICON: Record<ReasonStatus, { icon: typeof Check; className: string; label: string }> =
  {
    met: { icon: Check, className: "text-success", label: "results.reasonMet" },
    failed: { icon: X, className: "text-danger", label: "results.reasonFailed" },
    unknown: { icon: CircleHelp, className: "text-muted", label: "results.reasonUnknown" },
  };

function verdictChip(view: SchemeView, t: T): { tone: ChipTone; text: string } {
  const { verdict, near_miss } = view.result;
  if (verdict === "eligible") return { tone: "success", text: t("results.verdict.eligible") };
  if (near_miss) return { tone: "amber", text: t("results.verdict.almost") };
  if (verdict === "unknown") return { tone: "amber", text: t("results.verdict.unknown") };
  return { tone: "danger", text: t("results.verdict.ineligible") };
}

export function SchemeCard({ view, t }: { view: SchemeView; t: T }) {
  const { scheme, result, inPlan, droppedReason } = view;
  const verdict = verdictChip(view, t);
  const isAlmost =
    result.verdict !== "eligible" && (result.near_miss || result.verdict === "unknown");
  const close = closeDate(scheme);
  const isMeritPick = inPlan && scheme.scheme_type === "merit";
  const isClosed = scheme.application_window?.status === "closed";
  const notInPlan =
    result.verdict === "eligible" && scheme.scheme_type === "merit" && !inPlan && !isClosed;
  // Not-eligible cards carry no dates: there is nothing to apply for.
  const TypeIcon = scheme.scheme_type === "merit" ? Award : HeartHandshake;
  const showDates = !(result.verdict === "ineligible" && !isAlmost);

  return (
    <Card data-reveal className={isMeritPick ? "border-primary ring-2 ring-primary/20" : undefined}>
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="neutral">
          <TypeIcon className="size-3.5" aria-hidden />
          {t(`results.tag.${scheme.scheme_type}`)}
        </Chip>
        {isMeritPick && <Chip tone="primary">{t("results.pick")}</Chip>}
        {inPlan && !isMeritPick && <Chip tone="primary">{t("results.welfareIncluded")}</Chip>}
        {notInPlan && <Chip tone="neutral">{t("results.notInPlan")}</Chip>}
        {showDates && (
          <span className="ml-auto">
            <DaysChip scheme={scheme} t={t} />
          </span>
        )}
      </div>

      <h3 className="mt-3 font-serif text-xl font-semibold leading-snug">{scheme.name}</h3>
      <p className="mt-1 text-lg font-bold text-primary">
        {scheme.amount_inr_per_year === null
          ? t("results.amountUnknown")
          : `${formatInr(scheme.amount_inr_per_year)} ${t("results.perYearShort")}`}
      </p>
      {showDates && close && scheme.application_window?.status === "open" && (
        <p className="text-xs text-muted">
          {t("results.status.openUntil", { date: formatDate(close) })}
        </p>
      )}

      <div className="mt-3">
        <Chip tone={verdict.tone}>{verdict.text}</Chip>
      </div>

      {isAlmost ? (
        <div className="mt-3">
          <HowToQualify scheme={scheme} result={result} t={t} />
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {result.reasons.map((reason) => {
            const { icon: Icon, className, label } = REASON_ICON[reason.status];
            return (
              <li
                key={`${reason.field}-${reason.detail}`}
                className="flex items-start gap-2 text-sm"
              >
                <Icon className={`mt-0.5 size-5 shrink-0 ${className}`} aria-hidden />
                <span className="sr-only">{t(label)}: </span>
                <span>{reasonText(reason, t)}</span>
              </li>
            );
          })}
        </ul>
      )}

      {droppedReason && <p className="mt-3 text-sm text-muted">{droppedReason}</p>}

      <div className="mt-3">
        <SourceChip scheme={scheme} t={t} />
      </div>
    </Card>
  );
}
