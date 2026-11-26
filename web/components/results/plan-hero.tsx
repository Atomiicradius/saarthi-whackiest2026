import { CalendarClock, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { closeDate, daysUntil } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import type { SchemeView } from "@/lib/results-model";
import type { OptimizeResponse } from "@/lib/types";

type T = (path: string, vars?: Record<string, string | number>) => string;

// Nearest closing date among the schemes in the plan that are still open.
function nearestDeadline(planned: SchemeView[]): { date: string; days: number } | null {
  const dates = planned
    .map((view) => closeDate(view.scheme))
    .filter((date): date is string => date !== null)
    .map((date) => ({ date, days: daysUntil(date) }))
    .filter((entry) => entry.days >= 0)
    .sort((a, b) => a.days - b.days);
  return dates[0] ?? null;
}

export function PlanHero({
  plan,
  planned,
  t,
}: {
  plan: OptimizeResponse;
  planned: SchemeView[];
  t: T;
}) {
  const nearest = nearestDeadline(planned);
  const count = plan.selected.length;

  return (
    <section aria-label={t("results.heroLabel")} data-reveal>
      <p className="font-serif text-sm font-semibold uppercase tracking-wide text-primary">
        {t("results.heroLabel")}
      </p>
      <p className="text-soft mt-1 text-sm">
        {count === 0
          ? t("results.noPlan")
          : plan.total_inr_per_year > 0
            ? t("results.heroBody")
            : t("results.amountsUnconfirmed")}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="col-span-2 rounded-3xl bg-primary p-5 text-white shadow-[0_14px_32px_-16px_rgba(15,61,62,0.6)] lg:p-8">
          {plan.total_inr_per_year > 0 ? (
            <>
              <p className="font-serif text-5xl font-semibold leading-none lg:text-7xl">
                <CountUp value={plan.total_inr_per_year} kind="inr" />
              </p>
              <p className="mt-2 text-sm text-white/80">{t("results.perYear")}</p>
            </>
          ) : (
            <p className="font-serif text-3xl font-semibold leading-tight lg:text-5xl">
              {t("results.amountsUnconfirmed")}
            </p>
          )}
        </div>

        <Card className="p-4">
          <Layers className="size-5 text-primary" aria-hidden />
          <p className="mt-2 font-serif text-3xl font-semibold leading-none">{count}</p>
          <p className="mt-1 text-xs text-muted">
            {count === 1 ? t("results.schemeCountOne") : t("results.schemeCount", { count })}
          </p>
        </Card>

        <Card className="p-4">
          <CalendarClock className="size-5 text-primary" aria-hidden />
          {nearest ? (
            <>
              <p className="mt-2 font-serif text-xl font-semibold leading-tight">
                {formatDate(nearest.date)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {nearest.days === 1 ? "1 day left" : `${nearest.days} days left`}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">{t("results.status.unknown")}</p>
          )}
        </Card>
      </div>
    </section>
  );
}
