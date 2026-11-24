// Mirrors context/data-and-contracts.md. Change that file first, then this one.

export type Provider = "central" | "karnataka" | "other";
export type Portal = "nsp" | "other";
export type SchemeType = "merit" | "welfare";
export type WindowStatus = "open" | "closed" | "upcoming";
export type Operator = "==" | "!=" | "<" | "<=" | ">" | ">=" | "in" | "not_in" | "exists";

export interface Criterion {
  field: string;
  op: Operator;
  value: unknown;
}

export interface ApplicationWindow {
  ay: string;
  opens: string;
  closes: string;
  status: WindowStatus;
}

export interface Scheme {
  id: string;
  name: string;
  provider: Provider;
  portal: Portal;
  scheme_type: SchemeType;
  level: string[];
  amount_inr_per_year: number | null;
  deadline: string | null;
  application_window: ApplicationWindow | null;
  criteria: Criterion[];
  docs_required: string[];
  exclusive_with: string[];
  portal_url: string;
  source_url: string;
  confidence: number;
  last_verified: string;
  notes: string;
}

export type ProfileFieldName =
  | "state_of_domicile"
  | "category"
  | "minority_community"
  | "gender"
  | "disability"
  | "annual_family_income_inr"
  | "course"
  | "course_level"
  | "year_of_study"
  | "institution_type"
  | "last_exam_marks_pct";

export type FieldValue = string | number | boolean | null;

export interface ProfileField {
  value: FieldValue;
  source?: "voice" | "tap" | "manual";
  confirmed?: boolean;
}

export type Profile = Partial<Record<ProfileFieldName, ProfileField>>;

export type Verdict = "eligible" | "ineligible" | "unknown";
export type ReasonStatus = "met" | "failed" | "unknown";

export interface Reason {
  field: string;
  status: ReasonStatus;
  detail: string;
}

export interface NearMiss {
  field: string;
  gap: string;
  fixable: boolean;
}

export interface EligibilityResult {
  scheme_id: string;
  verdict: Verdict;
  reasons: Reason[];
  missing_fields: string[];
  near_miss?: NearMiss;
}

export interface InterviewNext {
  field: ProfileFieldName | null;
  question: string;
  choices: string[] | null;
  resolves_estimate: number;
}

export interface OptimizeResponse {
  selected: string[];
  total_inr_per_year: number;
  dropped: { scheme_id: string; reason: string }[];
}

export interface ApiErrorBody {
  error: { code: string; message: string };
}

export interface AuditEntry {
  idx: number;
  ts: string;
  actor: string;
  action: "grant" | "read" | "prefill" | "revoke" | "delete";
  fields: string[];
  purpose: string;
  prev_hash: string;
  hash: string;
}
