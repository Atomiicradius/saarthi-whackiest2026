import type { Reason } from "@/lib/types";

type T = (path: string, vars?: Record<string, string | number>) => string;

// The engine words a failed yes/no criterion as "<Label> no does not match the required yes". The
// UI shows "Needs <label>" instead. Only the display changes; the engine's reason data does not.
const REQUIRED_YES = /^(.+?) (?:yes|no) does not match the required yes$/i;

export function reasonText(reason: Reason, t: T): string {
  if (reason.status === "failed" && REQUIRED_YES.test(reason.detail)) {
    if (reason.field === "disability") return t("results.needsDisability");
    return t("results.needs", { label: t(`fields.${reason.field}`).toLowerCase() });
  }
  return reason.detail;
}
