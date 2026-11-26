"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { evaluate, getSchemes, interviewNext, optimize, usingMocks } from "@/lib/api";
import { GuidePanel } from "@/components/guide/guide-panel";
import type { GuideState } from "@/components/guide/guide";
import { Lane } from "@/components/results/lane";
import { PlanHero } from "@/components/results/plan-hero";
import { SampleDataBanner } from "@/components/sample-data-banner";
import { Button } from "@/components/ui/button";
import { formatInr } from "@/lib/format";
import { buildLanes } from "@/lib/results-model";
import { useSession } from "@/lib/session";
import { useReveal } from "@/lib/use-reveal";
import type { EligibilityResult, OptimizeResponse, Scheme } from "@/lib/types";

interface Loaded {
  schemes: Scheme[];
  results: EligibilityResult[];
  plan: OptimizeResponse;
  /** True when the interview has more questions to ask, so these results use the answers so far. */
  partial: boolean;
}

export default function ResultsPage() {
  const router = useRouter();
  const { profile, locale, t, restart } = useSession();
  const [data, setData] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState(false);
  const container = useRef<HTMLElement>(null);

  useEffect(() => {
    let cancelled = false;
    // The interview is unfinished when the state has not been asked or the engine still has a
    // question left. With the sample data there is no partial state.
    const nextQuestion = usingMocks ? Promise.resolve(null) : interviewNext(profile, locale);
    Promise.all([getSchemes(), evaluate(profile), optimize(profile), nextQuestion])
      .then(([schemes, results, plan, next]) => {
        const partial =
          !usingMocks && (profile.state_of_domicile?.confirmed !== true || next?.field != null);
        if (!cancelled) setData({ schemes, results, plan, partial });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [profile, locale, attempt]);

  // The guide is happy when the results first appear, then settles.
  useEffect(() => {
    if (!data) return;
    const timer = setTimeout(() => setSettled(true), 2800);
    return () => clearTimeout(timer);
  }, [data]);

  const retry = useCallback(() => {
    setFailed(false);
    setAttempt((count) => count + 1);
  }, []);

  const lanes = useMemo(
    () => (data ? buildLanes(data.schemes, data.results, data.plan) : null),
    [data],
  );

  useReveal(container, lanes !== null);

  const guideState: GuideState = failed
    ? "concerned"
    : !data
      ? "thinking"
      : settled
        ? "idle"
        : "happy";
  const planCount = data?.plan.selected.length ?? 0;
  const guideMessage = failed
    ? t("results.error")
    : !data
      ? t("results.loading")
      : planCount > 0 && data.plan.total_inr_per_year === 0
        ? t("results.guideNoAmount")
        : planCount > 0
          ? t(planCount === 1 ? "results.guideOne" : "results.guide", {
              count: planCount,
              total: formatInr(data.plan.total_inr_per_year),
            })
          : t("results.guideNone");

  return (
    <main ref={container}>
      <h1 className="sr-only">{t("results.title")}</h1>

      <div className="mb-6 max-w-3xl">
        <GuidePanel variant="strip" state={guideState} message={guideMessage} />
      </div>

      {failed && (
        <div role="alert" className="rounded-3xl border border-danger bg-surface p-4">
          <Button onClick={retry}>{t("results.retry")}</Button>
        </div>
      )}

      {data && lanes && (
        <>
          {data.partial && (
            <div data-reveal className="mb-4 flex flex-wrap items-center gap-3">
              <p className="text-soft text-sm">{t("results.partialNote")}</p>
              <Button onClick={() => router.push("/interview")}>
                {t("results.continueInterview")}
              </Button>
            </div>
          )}
          <SampleDataBanner schemes={data.schemes} text={t("results.sampleData")} />
          <PlanHero plan={data.plan} planned={lanes.eligible.filter((view) => view.inPlan)} t={t} />
          <Lane title={t("results.lane.eligible")} tone="success" views={lanes.eligible} t={t} />
          <Lane title={t("results.lane.almost")} tone="amber" views={lanes.almost} t={t} />
          <Lane title={t("results.lane.closed")} tone="neutral" views={lanes.closed} t={t} />
          <Lane title={t("results.lane.not")} tone="danger" views={lanes.not} t={t} />

          <p data-reveal className="text-soft mt-8 text-center text-sm">
            {t("results.footer")}
          </p>
          <div data-reveal className="mt-4 flex justify-center">
            <Button
              variant="secondary"
              onClick={() => {
                restart();
                router.push("/interview");
              }}
            >
              {t("results.startOver")}
            </Button>
          </div>
        </>
      )}
    </main>
  );
}
