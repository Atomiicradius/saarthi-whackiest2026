import { cn } from "@/lib/cn";
import type { EntryStatus } from "@/components/audit/chain-entry";

type T = (path: string, vars?: Record<string, string | number>) => string;

const LABEL: Record<EntryStatus, string> = {
  idle: "",
  ok: "audit.stripOk",
  broken: "audit.stripBroken",
  after: "audit.stripAfter",
};

const TONE: Record<EntryStatus, string> = {
  idle: "border-border bg-surface",
  ok: "border-success bg-surface",
  broken: "border-danger bg-[#f6ddd8]",
  after: "border-border bg-bg text-ink/70",
};

// A compact row of every entry and its result, so the downstream entries are visible without
// scrolling the timeline.
export function ChainStrip({ statuses, t }: { statuses: EntryStatus[]; t: T }) {
  return (
    <ol aria-label={t("audit.stripLabel")} className="mt-3 flex flex-wrap gap-2">
      {statuses.map((status, index) => (
        <li key={index} className={cn("rounded-2xl border px-3 py-2 text-sm", TONE[status])}>
          <span className="font-mono font-semibold">#{index}</span>{" "}
          <span className="font-semibold">{LABEL[status] ? t(LABEL[status]) : ""}</span>
        </li>
      ))}
    </ol>
  );
}
