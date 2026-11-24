import type { Scheme } from "@/lib/types";

const DAY_MS = 86_400_000;

// In demo mode "today" is pinned (default 2026-11-24) so the demo's days-left never drifts.
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const DEMO_TODAY = process.env.NEXT_PUBLIC_DEMO_TODAY || "2026-11-24";

function todayUtc(): number {
  if (DEMO_MODE) return Date.parse(`${DEMO_TODAY}T00:00:00Z`);
  const now = new Date();
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
}

// Whole days from today to an ISO date. Negative means the date has passed.
export function daysUntil(iso: string): number {
  return Math.round((Date.parse(`${iso}T00:00:00Z`) - todayUtc()) / DAY_MS);
}

export function closeDate(scheme: Scheme): string | null {
  return scheme.application_window?.closes ?? scheme.deadline;
}

export type Urgency = "closed" | "soon" | "month" | "later" | "unknown";

// Colour bands for the "days left" chip: 7 days or fewer, 30 days or fewer, more.
export function urgencyOf(scheme: Scheme): { urgency: Urgency; days: number | null } {
  if (scheme.application_window?.status === "closed") return { urgency: "closed", days: null };
  const close = closeDate(scheme);
  if (!close) return { urgency: "unknown", days: null };
  const days = daysUntil(close);
  if (days < 0) return { urgency: "closed", days: null };
  if (days <= 7) return { urgency: "soon", days };
  if (days <= 30) return { urgency: "month", days };
  return { urgency: "later", days };
}
