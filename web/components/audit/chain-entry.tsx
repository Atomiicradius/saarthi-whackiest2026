"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Link2, Link2Off } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { formatPurpose, formatTime, shortHash } from "@/components/audit/format";
import { cn } from "@/lib/cn";
import type { AuditEntry } from "@/lib/types";

export type EntryStatus = "idle" | "ok" | "broken" | "after";

type T = (path: string, vars?: Record<string, string | number>) => string;

const NODE_COLOR: Record<EntryStatus, string> = {
  idle: "border-border bg-surface text-muted",
  ok: "border-success bg-success text-white",
  broken: "border-danger bg-danger text-white",
  after: "border-border bg-border text-muted",
};

const RAIL_COLOR: Record<EntryStatus, string> = {
  idle: "bg-border",
  ok: "bg-success",
  broken: "bg-danger",
  after: "bg-border",
};

interface ChainEntryProps {
  entry: AuditEntry;
  status: EntryStatus;
  edited: boolean;
  isLast: boolean;
  t: T;
}

export function ChainEntry({ entry, status, edited, isLast, t }: ChainEntryProps) {
  const card = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLSpanElement>(null);
  const node = useRef<HTMLSpanElement>(null);

  // Link animation: the rail fills as the check reaches this entry; a break shakes the card.
  useEffect(() => {
    if (status === "idle" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      if (rail.current) {
        gsap.fromTo(
          rail.current,
          { scaleY: 0 },
          { scaleY: 1, duration: 0.35, ease: "power2.out", transformOrigin: "top" },
        );
      }
      if (node.current) {
        gsap.fromTo(node.current, { scale: 0.6 }, { scale: 1, duration: 0.4, ease: "back.out(3)" });
      }
      if (status === "broken" && card.current) {
        gsap.fromTo(card.current, { x: -8 }, { x: 0, duration: 0.8, ease: "elastic.out(1, 0.25)" });
      }
    });
    return () => context.revert();
  }, [status]);

  const broken = status === "broken";

  return (
    <li className="flex gap-3">
      <div className="flex w-8 shrink-0 flex-col items-center">
        <span
          ref={node}
          className={cn(
            "flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold",
            NODE_COLOR[status],
          )}
        >
          {entry.idx}
        </span>
        {!isLast && (
          <span className="relative mt-1 w-1 flex-1 min-h-6 rounded-full bg-border">
            <span
              ref={rail}
              className={cn(
                "absolute inset-0 rounded-full",
                RAIL_COLOR[status],
                status === "after" && "opacity-60",
              )}
            />
          </span>
        )}
      </div>

      <div
        ref={card}
        className={cn(
          "mb-3 min-w-0 flex-1 rounded-3xl border bg-surface p-4",
          broken ? "border-danger ring-2 ring-danger/20" : "border-border",
          status === "after" && "opacity-70",
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone={entry.actor === "copilot" ? "amber" : "neutral"}>{entry.actor}</Chip>
          <span className="font-semibold">{entry.action}</span>
          {edited && <Chip tone="danger">{t("audit.editedTag")}</Chip>}
          <time dateTime={entry.ts} className="ml-auto text-xs text-muted">
            {formatTime(entry.ts)}
          </time>
        </div>

        <p className="mt-2 text-sm">{formatPurpose(entry.purpose, t)}</p>

        <div className="mt-2 flex flex-wrap gap-1.5" aria-label={t("audit.fields")}>
          {entry.fields.map((field) => (
            <code key={field} className="rounded-lg bg-bg px-2 py-1 font-mono text-xs">
              {field}
            </code>
          ))}
        </div>

        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted">
          <span>#{shortHash(entry.hash)}</span>
          <span className="flex items-center gap-1">
            {broken ? (
              <Link2Off className="size-3.5" aria-hidden />
            ) : (
              <Link2 className="size-3.5" aria-hidden />
            )}
            {entry.idx === 0
              ? t("audit.genesis")
              : t("audit.prev", { hash: shortHash(entry.prev_hash) })}
          </span>
        </p>

        {broken && (
          <p className="mt-3 text-sm font-semibold text-danger">
            {t("audit.brokenTitle", { idx: entry.idx })}
          </p>
        )}
        {status === "after" && <p className="mt-3 text-sm text-muted">{t("audit.afterBreak")}</p>}
      </div>
    </li>
  );
}
