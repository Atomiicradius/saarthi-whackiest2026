import { Square, SquareCheck } from "lucide-react";
import { reasonText } from "@/lib/reason-text";
import { Chip } from "@/components/ui/chip";
import type { EligibilityResult, Scheme } from "@/lib/types";

interface HowToQualifyProps {
  scheme: Scheme;
  result: EligibilityResult;
  t: (path: string, vars?: Record<string, string | number>) => string;
}

// A checklist of the scheme's criteria. Met criteria are ticked, so the bar shows how close the
// student is. The near-miss line says what is left and whether the student can fix it.
export function HowToQualify({ scheme, result, t }: HowToQualifyProps) {
  const total = result.reasons.length;
  const done = result.reasons.filter((reason) => reason.status === "met").length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  // An engine line that asks for unanswered questions is shown as a short lead plus one bullet per
  // field, using the UI's own field labels, so the card stays readable in every language.
  const gap = result.near_miss?.gap ?? "";
  const unanswered = [
    ...new Set(result.reasons.filter((r) => r.status === "unknown").map((r) => r.field)),
  ];
  const asksQuestions =
    gap.startsWith("Answer th") && gap.includes("to find out") && unanswered.length > 0;
  const docs = scheme.docs_required.map((doc) => t(`docs.${doc}`)).join(", ");

  return (
    <section aria-label={t("results.howToQualify")} className="rounded-2xl bg-bg p-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="font-serif text-base font-semibold">{t("results.howToQualify")}</h4>
        <span className="text-xs font-semibold text-muted">
          {done} / {total}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-label={t("results.howToQualify")}
        className="mt-2 h-2 overflow-hidden rounded-full bg-border"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
      <ul className="mt-3 space-y-2">
        {result.reasons.map((reason) => {
          const met = reason.status === "met";
          const Icon = met ? SquareCheck : Square;
          return (
            <li key={`${reason.field}-${reason.detail}`} className="flex items-start gap-2 text-sm">
              <Icon
                className={
                  met ? "mt-0.5 size-5 shrink-0 text-success" : "mt-0.5 size-5 shrink-0 text-muted"
                }
                aria-hidden
              />
              <span>{reasonText(reason, t)}</span>
            </li>
          );
        })}
      </ul>
      {result.near_miss && (
        <div className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
          {asksQuestions ? (
            <>
              <p className="font-semibold">{t("results.toFindOut")}</p>
              <ul className="list-disc space-y-1 pl-5">
                {unanswered.map((field) => (
                  <li key={field}>{t(`fields.${field}`)}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="font-semibold">{gap}</p>
          )}
          <Chip tone={result.near_miss.fixable ? "success" : "neutral"}>
            {result.near_miss.fixable ? t("results.fixable") : t("results.notFixable")}
          </Chip>
        </div>
      )}
      {docs && <p className="mt-2 text-xs text-muted">{t("results.keepReady", { docs })}</p>}
    </section>
  );
}
