"use client";

import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { valueText } from "@/lib/answer-config";
import { useSession } from "@/lib/session";
import type { ProfileFieldName } from "@/lib/types";

// Every field the interview can ask, in a fixed order. Fields that were asked or answered come
// first, in the order they were asked; the rest follow.
const ALL_FIELDS: ProfileFieldName[] = [
  "state_of_domicile",
  "category",
  "annual_family_income_inr",
  "course_level",
  "year_of_study",
  "institution_type",
  "last_exam_marks_pct",
  "gender",
  "minority_community",
  "disability",
];

interface ProfileCardProps {
  /** The field being asked right now, if any. */
  currentField: ProfileFieldName | null;
  /** True once the engine says no further question would change the results. */
  done: boolean;
}

// Fills in live. Only confirmed answers get the tick. Once the interview is done, a field that was
// never asked reads "Not needed for your schemes", because the engine stopped asking.
export function ProfileCard({ currentField, done }: ProfileCardProps) {
  const { profile, steps, t } = useSession();

  const asked = steps.map((step) => step.field);
  if (currentField && !asked.includes(currentField)) asked.push(currentField);
  const answeredOther = ALL_FIELDS.filter((field) => !asked.includes(field) && profile[field]);
  const rest = ALL_FIELDS.filter((field) => !asked.includes(field) && !profile[field]);
  const rows = [...asked, ...answeredOther, ...rest];

  return (
    <Card>
      <h2 className="font-serif text-lg font-semibold">{t("interview.profileTitle")}</h2>
      <dl className="mt-2 divide-y divide-border">
        {rows.map((field) => {
          const answer = profile[field];
          const hasValue = answer && answer.value !== null;
          return (
            <div
              key={field}
              className="flex min-h-12 items-center justify-between gap-3 py-2 text-sm"
            >
              <dt className="text-muted">{t(`fields.${field}`)}</dt>
              <dd className="flex items-center gap-2 font-semibold">
                {hasValue ? (
                  <>
                    {valueText(field, answer.value, t)}
                    {answer.confirmed && (
                      <Check
                        className="size-4 text-success"
                        aria-label={t("interview.confirmed")}
                      />
                    )}
                  </>
                ) : (
                  <span className="font-normal text-muted">
                    {done && !asked.includes(field)
                      ? t("interview.notNeeded")
                      : t("interview.profileEmpty")}
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
      {done && <p className="mt-3 text-xs text-muted">{t("interview.skippedNote")}</p>}
    </Card>
  );
}
