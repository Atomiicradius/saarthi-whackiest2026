import { formatMoney } from "@/lib/format";
import type { FieldValue, ProfileFieldName } from "@/lib/types";

// How each profile field is answered by tapping. The API only sends the question text and
// choice labels, so the label-to-value mapping lives here.
export type AnswerConfig =
  | { kind: "chips"; values: Record<string, FieldValue> }
  | { kind: "stepper"; min: number; max: number; step: number; start: number };

export const ANSWER_CONFIG: Partial<Record<ProfileFieldName, AnswerConfig>> = {
  state_of_domicile: {
    kind: "chips",
    values: { Karnataka: "Karnataka", "Another state": "Other" },
  },
  category: {
    kind: "chips",
    values: { GEN: "GEN", OBC: "OBC", SC: "SC", ST: "ST", EWS: "EWS" },
  },
  annual_family_income_inr: { kind: "stepper", min: 0, max: 2000000, step: 20000, start: 200000 },
  course_level: {
    kind: "chips",
    values: { UG: "UG", PG: "PG", DIPLOMA: "DIPLOMA" },
  },
  year_of_study: { kind: "chips", values: { "1": 1, "2": 2, "3": 3, "4": 4 } },
  institution_type: {
    kind: "chips",
    values: { Government: "govt", Aided: "aided", Private: "private" },
  },
  last_exam_marks_pct: { kind: "stepper", min: 0, max: 100, step: 1, start: 75 },
};

const INSTITUTION_LABELS: Record<string, string> = {
  govt: "Government",
  aided: "Aided",
  private: "Private",
};

export function displayValue(field: ProfileFieldName, value: FieldValue): string {
  switch (field) {
    case "annual_family_income_inr":
      return formatMoney(Number(value));
    case "last_exam_marks_pct":
      return `${value}%`;
    case "year_of_study":
      return `Year ${value}`;
    case "institution_type":
      return INSTITUTION_LABELS[String(value)] ?? String(value);
    case "state_of_domicile":
      return value === "Other" ? "Another state" : String(value);
    default:
      return String(value);
  }
}

export function chipValue(field: ProfileFieldName, label: string): FieldValue {
  const config = ANSWER_CONFIG[field];
  return config?.kind === "chips" ? (config.values[label] ?? label) : label;
}
