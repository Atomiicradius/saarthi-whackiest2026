"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import interviewMock from "@/mocks/interview.json";
import raviProfile from "@/mocks/ravi.profile.json";
import { translate, type Locale } from "@/lib/i18n";
import type { FieldValue, Profile, ProfileFieldName } from "@/lib/types";

// One answered question. `resolves` feeds the "schemes still possible" bar.
export interface Step {
  field: ProfileFieldName;
  question: string;
  resolves: number;
}

interface Session {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string, vars?: Record<string, string | number>) => string;
  profile: Profile;
  steps: Step[];
  /** Records a tapped answer that the student has not confirmed yet. */
  proposeAnswer: (field: ProfileFieldName, value: FieldValue) => void;
  /** Drops an unconfirmed answer ("Change"). */
  discardAnswer: (field: ProfileFieldName) => void;
  /** Marks the answer confirmed and records the step ("Yes"). */
  confirmAnswer: (step: Step) => void;
  /** Undoes the last confirmed step and returns it. */
  goBack: () => Step | undefined;
  restart: () => void;
  loadRavi: () => void;
}

const SessionContext = createContext<Session | null>(null);

// The profile lives in memory only. It is never written to localStorage or the URL.
export function SessionProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const [profile, setProfile] = useState<Profile>({});
  const [steps, setSteps] = useState<Step[]>([]);

  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) => translate(locale, path, vars),
    [locale],
  );

  const proposeAnswer = useCallback((field: ProfileFieldName, value: FieldValue) => {
    setProfile((current) => ({ ...current, [field]: { value, source: "tap", confirmed: false } }));
  }, []);

  const discardAnswer = useCallback((field: ProfileFieldName) => {
    setProfile((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }, []);

  const confirmAnswer = useCallback((step: Step) => {
    setProfile((current) => {
      const answer = current[step.field];
      return answer ? { ...current, [step.field]: { ...answer, confirmed: true } } : current;
    });
    setSteps((current) => [...current, step]);
  }, []);

  const goBack = useCallback((): Step | undefined => {
    const last = steps[steps.length - 1];
    if (!last) return undefined;
    setSteps(steps.slice(0, -1));
    setProfile((current) => {
      const next = { ...current };
      delete next[last.field];
      return next;
    });
    return last;
  }, [steps]);

  const restart = useCallback(() => {
    setProfile({});
    setSteps([]);
  }, []);

  const loadRavi = useCallback(() => {
    setProfile(raviProfile as Profile);
    setSteps(
      interviewMock.questions.map((question) => ({
        field: question.field as ProfileFieldName,
        question: question.question,
        resolves: question.resolves_estimate,
      })),
    );
  }, []);

  const value = useMemo<Session>(
    () => ({
      locale,
      setLocale,
      t,
      profile,
      steps,
      proposeAnswer,
      discardAnswer,
      confirmAnswer,
      goBack,
      restart,
      loadRavi,
    }),
    [
      locale,
      t,
      profile,
      steps,
      proposeAnswer,
      discardAnswer,
      confirmAnswer,
      goBack,
      restart,
      loadRavi,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession must be used inside SessionProvider");
  return session;
}
