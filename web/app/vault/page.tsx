"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { evaluate, getSchemes, optimize } from "@/lib/api";
import { GuidePanel } from "@/components/guide/guide-panel";
import { PageColumns } from "@/components/page-columns";
import { DocRow } from "@/components/vault/doc-row";
import { Chip } from "@/components/ui/chip";
import { useSession } from "@/lib/session";
import { useReveal } from "@/lib/use-reveal";
import { vaultMode } from "@/lib/vault-adapter";
import type { Scheme } from "@/lib/types";

export default function VaultPage() {
  const { profile, t } = useSession();
  const [schemes, setSchemes] = useState<Scheme[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [possible, setPossible] = useState<string[]>([]);
  const container = useRef<HTMLElement>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getSchemes(), optimize(profile), evaluate(profile)])
      .then(([all, plan, results]) => {
        if (cancelled) return;
        setSchemes(all);
        setSelected(plan.selected);
        // Schemes the student has not been ruled out of: eligible, unknown or a near miss.
        setPossible(
          results
            .filter((result) => result.verdict !== "ineligible" || result.near_miss)
            .map((result) => result.scheme_id),
        );
      })
      .catch(() => {
        if (!cancelled) setSchemes([]);
      });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  // The checklist is every document the schemes in the plan ask for, with who needs it. If none of
  // them has documents confirmed yet, it falls back to the schemes the student may still qualify for.
  const { needed, usedFallback } = useMemo(() => {
    const collect = (ids: string[]) => {
      const byDoc = new Map<string, string[]>();
      for (const scheme of schemes ?? []) {
        if (!ids.includes(scheme.id)) continue;
        for (const doc of scheme.docs_required) {
          byDoc.set(doc, [...(byDoc.get(doc) ?? []), scheme.name]);
        }
      }
      return [...byDoc.entries()];
    };
    const fromPlan = collect(selected);
    if (fromPlan.length > 0) return { needed: fromPlan, usedFallback: false };
    return { needed: collect(possible), usedFallback: true };
  }, [schemes, selected, possible]);

  useReveal(container, schemes !== null);

  return (
    <PageColumns ref={container} guide={<GuidePanel state="idle" message={t("vault.guide")} />}>
      <h1 className="font-serif text-3xl font-semibold leading-tight lg:text-4xl">
        {t("vault.title")}
      </h1>
      <p className="text-soft mt-2">{t("vault.intro")}</p>
      {vaultMode === "stub" && (
        <Chip className="mt-3">
          <Lock className="size-3.5" aria-hidden />
          {t("vault.stubNote")}
        </Chip>
      )}

      {schemes === null ? (
        <p role="status" className="text-soft py-16 text-center">
          {t("vault.loading")}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {usedFallback && needed.length > 0 && (
            <p className="text-soft text-sm">{t("vault.fallbackNote")}</p>
          )}
          {needed.map(([docKey, names]) => (
            <DocRow key={docKey} docKey={docKey} neededFor={names} />
          ))}
        </div>
      )}
    </PageColumns>
  );
}
