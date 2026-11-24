"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSchemes, optimize } from "@/lib/api";
import { DocRow } from "@/components/vault/doc-row";
import { SampleDataBanner } from "@/components/sample-data-banner";
import { useSession } from "@/lib/session";
import { useStaggerReveal } from "@/lib/use-stagger-reveal";
import { vaultMode } from "@/lib/vault-adapter";
import type { Scheme } from "@/lib/types";

export default function VaultPage() {
  const { profile, t } = useSession();
  const [schemes, setSchemes] = useState<Scheme[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const container = useRef<HTMLElement>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getSchemes(), optimize(profile)])
      .then(([all, plan]) => {
        if (cancelled) return;
        setSchemes(all);
        setSelected(plan.selected);
      })
      .catch(() => {
        if (!cancelled) setSchemes([]);
      });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  // The checklist is every document the schemes in the plan ask for, with who needs it.
  const needed = useMemo(() => {
    const byDoc = new Map<string, string[]>();
    for (const scheme of schemes ?? []) {
      if (!selected.includes(scheme.id)) continue;
      for (const doc of scheme.docs_required) {
        byDoc.set(doc, [...(byDoc.get(doc) ?? []), scheme.name]);
      }
    }
    return [...byDoc.entries()];
  }, [schemes, selected]);

  useStaggerReveal(container, schemes !== null);

  return (
    <main ref={container} className="mx-auto max-w-[480px]">
      <h1 className="font-serif text-3xl font-semibold leading-tight">{t("vault.title")}</h1>
      <p className="mt-2 text-muted">{t("vault.intro")}</p>
      {vaultMode === "stub" && (
        <p className="mt-3 rounded-2xl bg-amber px-4 py-3 text-sm font-semibold text-ink">
          {t("vault.stubNote")}
        </p>
      )}

      {schemes === null ? (
        <p role="status" className="py-16 text-center text-muted">
          {t("vault.loading")}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          <SampleDataBanner schemes={schemes} text={t("results.sampleData")} />
          {needed.map(([docKey, names]) => (
            <DocRow key={docKey} docKey={docKey} neededFor={names} />
          ))}
        </div>
      )}
    </main>
  );
}
