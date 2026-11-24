"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSchemeCount, interviewNext } from "@/lib/api";
import { GuidePanel } from "@/components/guide/guide-panel";
import type { GuideState } from "@/components/guide/guide";
import { LanguageChips } from "@/components/interview/language-chips";
import { PageColumns } from "@/components/page-columns";
import { NarrowingBar } from "@/components/interview/narrowing-bar";
import { ProfileCard } from "@/components/interview/profile-card";
import { ReadbackBubbles } from "@/components/interview/readback-bubbles";
import { StepperInput } from "@/components/interview/stepper-input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  const [mood, setMood] = useState<GuideState>("idle");
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
    // A short happy bounce for the guide, then back to calm.
    setMood("happy");
    setTimeout(() => setMood("idle"), 1600);
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

  const guideState: GuideState = failed ? "concerned" : !question ? "thinking" : mood;
  const guideMessage = failed
    ? t("interview.error")
    : !question
      ? t("interview.loading")
      : field === null
        ? `${t("interview.done")}. ${t("interview.doneBody")}`
        : question.question;

  return (
    <PageColumns guide={<GuidePanel state={guideState} message={guideMessage} showMic />}>
      <div className="space-y-4">
        <header>
          <h1 className="font-serif text-3xl font-semibold leading-tight lg:text-4xl">
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
              <span className="text-sm font-semibold text-soft">
                {t("interview.step", { current: steps.length + 1 })}
              </span>
            )}
          </div>

          {failed && (
            <div role="alert">
              <Button onClick={() => setAttempt((count) => count + 1)}>
                {t("interview.retry")}
              </Button>
            </div>
          )}

          {question && field === null && (
            <Button className="w-full" onClick={() => router.push("/results")}>
              {t("interview.seeResults")}
            </Button>
          )}

          {question && field && (
            <>
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
        </Card>

        <ProfileCard />
      </div>
    </PageColumns>
  );
}
