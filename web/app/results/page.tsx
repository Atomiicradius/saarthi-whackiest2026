"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { evaluate, getSchemes, optimize } from "@/lib/api";
import { Lane } from "@/components/results/lane";
import { PlanHero } from "@/components/results/plan-hero";
import { SampleDataBanner } from "@/components/sample-data-banner";
import { Button } from "@/components/ui/button";
import { buildLanes } from "@/lib/results-model";
import { useSession } from "@/lib/session";
import { useStaggerReveal } from "@/lib/use-stagger-reveal";
import type { EligibilityResult, OptimizeResponse, Scheme } from "@/lib/types";

interface Loaded {
  schemes: Scheme[];
  results: EligibilityResult[];
  plan: OptimizeResponse;
}

export default function ResultsPage() {
  const router = useRouter();
  const { profile, t, restart } = useSession();
  const [data, setData] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getSchemes(), evaluate(profile), optimize(profile)])
      .then(([schemes, results, plan]) => {
        if (!cancelled) setData({ schemes, results, plan });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [profile, attempt]);

  const retry = useCallback(() => {
    setFailed(false);
    setAttempt((count) => count + 1);
  }, []);

  const lanes = useMemo(
    () => (data ? buildLanes(data.schemes, data.results, data.plan) : null),
    [data],
  );

  useStaggerReveal(container, lanes !== null);

  return (
    <main ref={container}>
      <h1 className="sr-only">{t("results.title")}</h1>

      {failed && (
        <div role="alert" className="rounded-3xl border border-danger bg-surface p-4">
          <p>{t("results.error")}</p>
          <Button className="mt-3" onClick={retry}>
            {t("results.retry")}
          </Button>
        </div>
      )}

      {!failed && !data && (
        <p role="status" className="py-16 text-center text-muted">
          {t("results.loading")}
        </p>
      )}

      {data && lanes && (
        <>
          <SampleDataBanner schemes={data.schemes} text={t("results.sampleData")} />
          <PlanHero plan={data.plan} planned={lanes.eligible.filter((view) => view.inPlan)} t={t} />
          <Lane title={t("results.lane.eligible")} tone="success" views={lanes.eligible} t={t} />
          <Lane title={t("results.lane.almost")} tone="amber" views={lanes.almost} t={t} />
          <Lane title={t("results.lane.closed")} tone="neutral" views={lanes.closed} t={t} />
          <Lane title={t("results.lane.not")} tone="danger" views={lanes.not} t={t} />

          <p data-reveal className="mt-8 text-center text-sm text-muted">
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
