"use client";

import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { displayValue } from "@/lib/answer-config";
import { useSession } from "@/lib/session";
import type { ProfileFieldName } from "@/lib/types";

const SHOWN_FIELDS: ProfileFieldName[] = [
  "state_of_domicile",
  "category",
  "annual_family_income_inr",
  "course_level",
  "year_of_study",
  "institution_type",
  "last_exam_marks_pct",
];

// Fills in live. Only confirmed answers get the tick.
export function ProfileCard() {
  const { profile, t } = useSession();
  return (
    <Card>
      <h2 className="font-serif text-lg font-semibold">{t("interview.profileTitle")}</h2>
      <dl className="mt-2 divide-y divide-border">
        {SHOWN_FIELDS.map((field) => {
          const answer = profile[field];
          return (
            <div
              key={field}
              className="flex min-h-12 items-center justify-between gap-3 py-2 text-sm"
            >
              <dt className="text-muted">{t(`fields.${field}`)}</dt>
              <dd className="flex items-center gap-2 font-semibold">
                {answer && answer.value !== null ? (
                  <>
                    {displayValue(field, answer.value)}
                    {answer.confirmed && (
                      <Check
                        className="size-4 text-success"
                        aria-label={t("interview.confirmed")}
                      />
                    )}
                  </>
                ) : (
                  <span className="font-normal text-muted">{t("interview.profileEmpty")}</span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </Card>
  );
}
