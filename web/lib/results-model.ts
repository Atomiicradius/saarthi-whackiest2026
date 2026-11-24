import type { EligibilityResult, OptimizeResponse, Scheme } from "@/lib/types";

export interface SchemeView {
  scheme: Scheme;
  result: EligibilityResult;
  inPlan: boolean;
  droppedReason: string | null;
}

export interface Lanes {
  eligible: SchemeView[];
  almost: SchemeView[];
  closed: SchemeView[];
  not: SchemeView[];
}

// Lane rules: a scheme whose application window is closed goes to "closed", whatever its verdict.
// Otherwise eligible verdicts go to "eligible". Anything not eligible that has a near miss, or is
// still unknown, is "almost". The rest are "not eligible".
export function buildLanes(
  schemes: Scheme[],
  results: EligibilityResult[],
  plan: OptimizeResponse,
): Lanes {
  const byId = new Map(schemes.map((scheme) => [scheme.id, scheme]));
  const lanes: Lanes = { eligible: [], almost: [], closed: [], not: [] };

  for (const result of results) {
    const scheme = byId.get(result.scheme_id);
    if (!scheme) continue;
    const view: SchemeView = {
      scheme,
      result,
      inPlan: plan.selected.includes(scheme.id),
      droppedReason: plan.dropped.find((drop) => drop.scheme_id === scheme.id)?.reason ?? null,
    };
    if (scheme.application_window?.status === "closed") lanes.closed.push(view);
    else if (result.verdict === "eligible") lanes.eligible.push(view);
    else if (result.near_miss || result.verdict === "unknown") lanes.almost.push(view);
    else lanes.not.push(view);
  }

  // Plan picks first, then by yearly amount.
  lanes.eligible.sort(
    (a, b) =>
      Number(b.inPlan) - Number(a.inPlan) ||
      (b.scheme.amount_inr_per_year ?? 0) - (a.scheme.amount_inr_per_year ?? 0),
  );
  return lanes;
}
