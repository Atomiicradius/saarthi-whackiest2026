"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { evaluate, getSchemeCount, interviewNext, usingMocks } from "@/lib/api";
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
import { useVoiceAnswer } from "@/lib/use-voice-answer";
import { RAVI } from "@/lib/ravi";
import type { FieldValue, InterviewNext, ProfileFieldName } from "@/lib/types";

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

  // "Schemes still possible" = schemes the engine has not ruled out (eligible or unknown) for the
  // answers so far. With the sample data there is no engine, so the scripted per-question counts
  // are used instead. The API's resolves_estimate is a forecast of how many unknowns a question
  // would settle either way, not a count of eliminations, so it must not be subtracted.
  const [possible, setPossible] = useState<number | null>(null);
  const stepsKey = steps.map((step) => step.field).join(",");
  useEffect(() => {
    if (usingMocks || stepsKey === "") return;
    let cancelled = false;
    evaluate(profileRef.current)
      .then((results) => {
        if (!cancelled) setPossible(results.filter((r) => r.verdict !== "ineligible").length);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [stepsKey]);

  const remaining = useMemo(() => {
    if (usingMocks) {
      return Math.max(0, totalSchemes - steps.reduce((sum, step) => sum + step.resolves, 0));
    }
    if (steps.length === 0 || possible === null) return totalSchemes;
    return Math.min(totalSchemes, possible);
  }, [totalSchemes, steps, possible]);

  const field = question?.field ?? null;

  // A spoken answer is proposed like a tapped one, so the read-back still asks the student.
  const proposeSpoken = useCallback(
    (asked: ProfileFieldName, value: FieldValue) => proposeAnswer(asked, value, "voice"),
    [proposeAnswer],
  );
  const voice = useVoiceAnswer(field, locale, proposeSpoken);
  const tapped = field ? profile[field] : undefined;
  // "Start as Ravi" suggests Ravi's answer for each question; the student still confirms it.
  const suggested = persona === "ravi" && field ? RAVI[field]?.value : undefined;
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
        : voice.note
          ? t(`voice.${voice.note.key}`, { text: voice.note.heard ?? "" })
          : question.question;

  // Choice labels come from the API in English (they key answer-config); only the text shown
  // is translated.
  const choiceText = (label: string) => {
    const key = `choices.${label}`;
    const text = t(key);
    return text === key ? label : text;
  };

  return (
    <PageColumns
      guide={
        <GuidePanel
          state={guideState}
          message={guideMessage}
          showMic
          voice={voice.available ? { state: voice.state, onPress: voice.press } : undefined}
        />
      }
    >
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
                      {choiceText(label)}
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
