"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { CircleCheck, TriangleAlert } from "lucide-react";
import { ChainEntry, type EntryStatus } from "@/components/audit/chain-entry";
import { ChainStrip } from "@/components/audit/chain-strip";
import { GuidePanel } from "@/components/guide/guide-panel";
import type { GuideState } from "@/components/guide/guide";
import { PageColumns } from "@/components/page-columns";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session";
import { useStaggerReveal } from "@/lib/use-stagger-reveal";
import { vault, type VerifyResult } from "@/lib/vault-adapter";
import type { AuditEntry } from "@/lib/types";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const STEP_SECONDS = 0.4;

export default function AuditPage() {
  const { audit, t } = useSession();
  const [tamperedIdx, setTamperedIdx] = useState<number | null>(null);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [running, setRunning] = useState(false);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const container = useRef<HTMLElement>(null);
  useStaggerReveal(container, true);

  useEffect(() => () => void timeline.current?.kill(), []);

  // The demo tamper flips who did entry 1. It changes the in-memory copy only.
  const entries = useMemo<AuditEntry[]>(
    () =>
      audit.map((entry) =>
        entry.idx === tamperedIdx
          ? { ...entry, actor: entry.actor === "user" ? "copilot" : "user" }
          : entry,
      ),
    [audit, tamperedIdx],
  );

  function reset() {
    timeline.current?.kill();
    setResult(null);
    setRevealed(0);
    setRunning(false);
  }

  async function verify() {
    reset();
    setRunning(true);
    const outcome = await vault.verifyChain(entries);
    setResult(outcome);
    const total = entries.length;
    const reach = outcome.ok ? total : (outcome.brokenAt ?? 0) + 1;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(total);
      setRunning(false);
      return;
    }
    const steps = gsap.timeline({ onComplete: () => setRunning(false) });
    for (let i = 0; i < reach; i += 1) {
      steps.call(() => setRevealed(i + 1), undefined, i * STEP_SECONDS);
    }
    // After a break, the entries behind it are marked as untrustworthy.
    if (!outcome.ok) steps.call(() => setRevealed(total), undefined, reach * STEP_SECONDS + 0.5);
    timeline.current = steps;
  }

  function statusOf(index: number): EntryStatus {
    if (!result || index >= revealed) return "idle";
    if (result.ok) return "ok";
    const brokenAt = result.brokenAt ?? 0;
    if (index < brokenAt) return "ok";
    return index === brokenAt ? "broken" : "after";
  }

  const finished = result !== null && !running;

  const guideState: GuideState = running
    ? "thinking"
    : finished
      ? result.ok
        ? "happy"
        : "concerned"
      : "idle";
  const guideMessage = running
    ? t("audit.guideChecking")
    : finished
      ? result.ok
        ? t("audit.guideOk")
        : t("audit.guideBroken", { idx: result.brokenAt ?? 0 })
      : t("audit.guide");

  return (
    <PageColumns ref={container} guide={<GuidePanel state={guideState} message={guideMessage} />}>
      <h1 data-reveal className="font-serif text-3xl font-semibold leading-tight lg:text-4xl">
        {t("audit.title")}
      </h1>
      <p data-reveal className="text-soft mt-2">
        {t("audit.intro")}
      </p>

      <div data-reveal className="mt-4 flex flex-wrap gap-2">
        <Button onClick={verify} disabled={running}>
          {t("audit.verify")}
        </Button>
        {DEMO_MODE && tamperedIdx === null && (
          <Button
            variant="secondary"
            disabled={running}
            onClick={() => {
              reset();
              setTamperedIdx(Math.min(1, audit.length - 1));
            }}
          >
            {t("audit.tamper")}
          </Button>
        )}
        {DEMO_MODE && tamperedIdx !== null && (
          <Button
            variant="ghost"
            disabled={running}
            onClick={() => {
              reset();
              setTamperedIdx(null);
            }}
          >
            {t("audit.restore")}
          </Button>
        )}
      </div>
      {DEMO_MODE && <p className="mt-2 text-xs text-soft">{t("audit.demoNote")}</p>}

      <p role="status" className="mt-3 min-h-5 text-sm text-soft">
        {running
          ? t("audit.verifying", {
              n: Math.min(revealed + 1, entries.length),
              total: entries.length,
            })
          : ""}
      </p>

      {finished && result.ok && (
        <div
          role="status"
          className="mt-2 flex items-start gap-3 rounded-3xl border border-success bg-surface p-4"
        >
          <CircleCheck className="mt-0.5 size-6 shrink-0 text-success" aria-hidden />
          <div>
            <p className="font-serif text-lg font-semibold">{t("audit.okTitle")}</p>
            <p className="text-sm">{t("audit.okBody", { count: entries.length })}</p>
          </div>
        </div>
      )}
      {finished && !result.ok && (
        <div
          role="alert"
          className="mt-2 flex items-start gap-3 rounded-3xl border border-danger bg-surface p-4"
        >
          <TriangleAlert className="mt-0.5 size-6 shrink-0 text-danger" aria-hidden />
          <div>
            <p className="font-serif text-lg font-semibold">
              {t("audit.brokenTitle", { idx: result.brokenAt ?? 0 })}
            </p>
            <p className="text-sm">{t("audit.brokenBody", { idx: result.brokenAt ?? 0 })}</p>
          </div>
        </div>
      )}

      {finished && <ChainStrip statuses={entries.map((_, index) => statusOf(index))} t={t} />}

      <ol data-reveal className="mt-6">
        {entries.map((entry, index) => (
          <ChainEntry
            key={entry.idx}
            entry={entry}
            status={statusOf(index)}
            edited={entry.idx === tamperedIdx}
            isLast={index === entries.length - 1}
            t={t}
          />
        ))}
      </ol>
    </PageColumns>
  );
}
