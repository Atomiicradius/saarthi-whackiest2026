"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import auditMock from "@/mocks/audit.json";
import interviewMock from "@/mocks/interview.json";
import { RAVI } from "@/lib/ravi";
import { translate, type Locale } from "@/lib/i18n";
import { vault, type NewAuditEntry, type VaultBlob } from "@/lib/vault-adapter";
import type { AuditEntry, FieldValue, Profile, ProfileFieldName } from "@/lib/types";

// One answered question. `resolves` feeds the "schemes still possible" bar.
export interface Step {
  field: ProfileFieldName;
  question: string;
  resolves: number;
}

// A document the student encrypted. Only the encrypted blob is kept, never the readable file.
export interface StoredDoc {
  docKey: string;
  fileName: string;
  fileSize: number;
  mime: string;
  blob: VaultBlob;
}

interface Session {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string, vars?: Record<string, string | number>) => string;
  profile: Profile;
  steps: Step[];
  /** "ravi" pre-fills Ravi's answers as suggestions in the interview. */
  persona: "ravi" | null;
  setPersona: (persona: "ravi" | null) => void;
  /** Records a tapped or spoken answer that the student has not confirmed yet. */
  proposeAnswer: (field: ProfileFieldName, value: FieldValue, source?: "tap" | "voice") => void;
  /** Drops an unconfirmed answer ("Change"). */
  discardAnswer: (field: ProfileFieldName) => void;
  /** Stores the answer as confirmed and records the step ("Yes"). */
  confirmAnswer: (step: Step, value: FieldValue) => void;
  /** Undoes the last confirmed step and returns it. */
  goBack: () => Step | undefined;
  restart: () => void;
  loadRavi: () => void;
  documents: StoredDoc[];
  addDocument: (doc: StoredDoc) => void;
  audit: AuditEntry[];
  /** Appends to the audit chain through the vault adapter. Field names only, never values. */
  recordAudit: (entry: NewAuditEntry) => Promise<void>;
}

const SessionContext = createContext<Session | null>(null);

// Everything lives in memory only. Nothing is written to localStorage or the URL.
export function SessionProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const [profile, setProfile] = useState<Profile>({});
  const [steps, setSteps] = useState<Step[]>([]);
  const [persona, setPersona] = useState<"ravi" | null>(null);
  const [documents, setDocuments] = useState<StoredDoc[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>(auditMock as AuditEntry[]);
  const auditRef = useRef(audit);

  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) => translate(locale, path, vars),
    [locale],
  );

  const proposeAnswer = useCallback(
    (field: ProfileFieldName, value: FieldValue, source: "tap" | "voice" = "tap") => {
      setProfile((current) => ({ ...current, [field]: { value, source, confirmed: false } }));
    },
    [],
  );

  const discardAnswer = useCallback((field: ProfileFieldName) => {
    setProfile((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }, []);

  const confirmAnswer = useCallback((step: Step, value: FieldValue) => {
    setProfile((current) => ({
      ...current,
      [step.field]: { value, source: current[step.field]?.source ?? "tap", confirmed: true },
    }));
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
    setPersona(null);
  }, []);

  const loadRavi = useCallback(() => {
    setPersona(null);
    setProfile(RAVI);
    setSteps(
      interviewMock.questions.map((question) => ({
        field: question.field as ProfileFieldName,
        question: question.question,
        resolves: question.resolves_estimate,
      })),
    );
  }, []);

  const addDocument = useCallback((doc: StoredDoc) => {
    setDocuments((current) => [...current.filter((item) => item.docKey !== doc.docKey), doc]);
  }, []);

  const recordAudit = useCallback(async (entry: NewAuditEntry) => {
    const appended = await vault.appendAudit(entry, auditRef.current);
    auditRef.current = [...auditRef.current, appended];
    setAudit(auditRef.current);
  }, []);

  const value = useMemo<Session>(
    () => ({
      locale,
      setLocale,
      t,
      profile,
      steps,
      persona,
      setPersona,
      proposeAnswer,
      discardAnswer,
      confirmAnswer,
      goBack,
      restart,
      loadRavi,
      documents,
      addDocument,
      audit,
      recordAudit,
    }),
    [
      locale,
      t,
      profile,
      steps,
      persona,
      proposeAnswer,
      discardAnswer,
      confirmAnswer,
      goBack,
      restart,
      loadRavi,
      documents,
      addDocument,
      audit,
      recordAudit,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession must be used inside SessionProvider");
  return session;
}
