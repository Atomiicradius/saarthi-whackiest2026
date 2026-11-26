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
  gender: { kind: "chips", values: { Female: "F", Male: "M", Other: "O" } },
  disability: { kind: "chips", values: { Yes: true, No: false } },
  minority_community: { kind: "chips", values: { Yes: true, No: false } },
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
      return String(value); // the row and the read-back already say "Year"
    case "institution_type":
      return INSTITUTION_LABELS[String(value)] ?? String(value);
    case "state_of_domicile":
      return value === "Other" ? "Another state" : String(value);
    default:
      return String(value);
  }
}

// The text shown for an answer: a chip answer uses its (translated) chip label, so a yes/no
// answer reads "Yes" or "No" and never "true" or "false". Numbers keep their own formatting.
export function valueText(
  field: ProfileFieldName,
  value: FieldValue,
  t: (path: string) => string,
): string {
  const config = ANSWER_CONFIG[field];
  if (config?.kind === "chips" && field !== "year_of_study") {
    const label = Object.entries(config.values).find(([, chip]) => chip === value)?.[0];
    if (label) return t(`choices.${label}`);
  }
  return displayValue(field, value);
}

export function chipValue(field: ProfileFieldName, label: string): FieldValue {
  const config = ANSWER_CONFIG[field];
  return config?.kind === "chips" ? (config.values[label] ?? label) : label;
}
