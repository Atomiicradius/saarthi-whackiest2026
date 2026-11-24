"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { getSchemes, optimize } from "@/lib/api";
import { GuidePanel } from "@/components/guide/guide-panel";
import { PageColumns } from "@/components/page-columns";
import { DocRow } from "@/components/vault/doc-row";
import { Chip } from "@/components/ui/chip";
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
          {needed.map(([docKey, names]) => (
            <DocRow key={docKey} docKey={docKey} neededFor={names} />
          ))}
        </div>
      )}
    </PageColumns>
  );
}
