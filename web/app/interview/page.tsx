"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSchemeCount, interviewNext } from "@/lib/api";
import { LanguageChips } from "@/components/interview/language-chips";
import { MicOrb } from "@/components/interview/mic-orb";
import { NarrowingBar } from "@/components/interview/narrowing-bar";
import { ProfileCard } from "@/components/interview/profile-card";
import { ReadbackBubbles } from "@/components/interview/readback-bubbles";
import { StepperInput } from "@/components/interview/stepper-input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReadAloudButton } from "@/components/ui/read-aloud-button";
import { ANSWER_CONFIG, chipValue, displayValue } from "@/lib/answer-config";
import { cn } from "@/lib/cn";
import { useSession } from "@/lib/session";
import raviProfile from "@/mocks/ravi.profile.json";
import type { FieldValue, InterviewNext, Profile } from "@/lib/types";

export default function InterviewPage() {
  const router = useRouter();
  const {
    profile,
    steps,
    locale,
    persona,
    t,
    setPersona,
    proposeAnswer,
    discardAnswer,
    confirmAnswer,
    goBack,
  } = useSession();
  const [totalSchemes, setTotalSchemes] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<{ key: string; question: InterviewNext } | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [stepper, setStepper] = useState<{ field: string; value: number } | null>(null);

  // The next question depends only on confirmed answers, so refetch when the step list changes.
  // Each request has a key; a result for an older key is treated as "still loading".
  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);
  const requestKey = `${steps.map((step) => step.field).join(",")}|${locale}|${attempt}`;

  useEffect(() => {
    let cancelled = false;
    interviewNext(profileRef.current, locale)
      .then((next) => {
        if (!cancelled) setLoaded({ key: requestKey, question: next });
      })
      .catch(() => {
        if (!cancelled) setFailedKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [requestKey, locale]);

  const question = loaded?.key === requestKey ? loaded.question : null;
  const failed = failedKey === requestKey;

  useEffect(() => {
    getSchemeCount()
      .then(setTotalSchemes)
      .catch(() => setTotalSchemes(0));
  }, []);

  const remaining = useMemo(
    () => Math.max(0, totalSchemes - steps.reduce((sum, step) => sum + step.resolves, 0)),
    [totalSchemes, steps],
  );

  const field = question?.field ?? null;
  const tapped = field ? profile[field] : undefined;
  // "Start as Ravi" suggests Ravi's answer for each question; the student still confirms it.
  const suggested =
    persona === "ravi" && field ? (raviProfile as Profile)[field]?.value : undefined;
  const pendingValue: FieldValue | undefined =
    tapped && !tapped.confirmed ? tapped.value : suggested;
  const hasPending = pendingValue !== undefined && pendingValue !== null;
  const config = field ? ANSWER_CONFIG[field] : undefined;

  const stepperValue =
    config?.kind === "stepper" ? (stepper?.field === field ? stepper.value : config.start) : 0;

  function confirm() {
    if (!question || !field || !hasPending) return;
    confirmAnswer(
      { field, question: question.question, resolves: question.resolves_estimate },
      pendingValue,
    );
  }

  function change() {
    if (field) discardAnswer(field);
    setPersona(null);
  }

  function back() {
    if (hasPending) change();
    else goBack();
  }

  const answerText = field && hasPending ? displayValue(field, pendingValue) : "";

  return (
    <main className="mx-auto max-w-[480px] space-y-4">
      <header>
        <p className="font-serif text-sm font-semibold uppercase tracking-wide text-primary">
          {t("app.name")}
        </p>
        <h1 className="mt-1 font-serif text-3xl font-semibold leading-tight">
          {t("interview.title")}
        </h1>
      </header>

      <LanguageChips />
      <NarrowingBar
        total={totalSchemes}
        remaining={remaining}
        label={t("interview.narrowingLabel")}
        caption={t("interview.narrowing", { total: totalSchemes, remaining })}
      />

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="-ml-3"
            disabled={steps.length === 0 && !hasPending}
            onClick={back}
          >
            <ArrowLeft className="size-5" aria-hidden />
            {t("interview.back")}
          </Button>
          {field && (
            <span className="text-sm font-semibold text-muted">
              {t("interview.step", { current: steps.length + 1 })}
            </span>
          )}
        </div>

        {failed && (
          <div role="alert">
            <p>{t("interview.error")}</p>
            <Button className="mt-3" onClick={() => setAttempt((count) => count + 1)}>
              {t("interview.retry")}
            </Button>
          </div>
        )}

        {!failed && !question && (
          <p role="status" className="py-8 text-center text-muted">
            {t("interview.loading")}
          </p>
        )}

        {question && field === null && (
          <div className="space-y-3 py-4 text-center">
            <h2 className="font-serif text-2xl font-semibold">{t("interview.done")}</h2>
            <p className="text-muted">{t("interview.doneBody")}</p>
            <Button className="w-full" onClick={() => router.push("/results")}>
              {t("interview.seeResults")}
            </Button>
          </div>
        )}

        {question && field && (
          <>
            <div className="flex items-start gap-1">
              <h2 className="font-serif text-3xl font-semibold leading-tight">
                {question.question}
              </h2>
              <ReadAloudButton text={question.question} />
            </div>

            {hasPending ? (
              <ReadbackBubbles
                answerText={answerText}
                readbackText={t("interview.readback", {
                  answer: `${t(`fields.${field}`)} ${answerText}`,
                })}
                onYes={confirm}
                onChange={change}
              />
            ) : config?.kind === "stepper" ? (
              <StepperInput
                value={stepperValue}
                min={config.min}
                max={config.max}
                step={config.step}
                display={displayValue(field, stepperValue)}
                onChange={(value) => setStepper({ field, value })}
                onUse={() => proposeAnswer(field, stepperValue)}
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {(question.choices ?? []).map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => proposeAnswer(field, chipValue(field, label))}
                    className={cn(
                      "min-h-14 min-w-14 rounded-2xl border border-border bg-bg px-5 text-lg font-semibold",
                      "hover:border-primary hover:bg-surface",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <MicOrb />
      </Card>

      <ProfileCard />
    </main>
  );
}
