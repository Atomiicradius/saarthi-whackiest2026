"use client";

import { SAMPLE_NAME_KEY } from "@/lib/sample-student";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { useSession } from "@/lib/session";

// Demo and dev only: restores the mock persona so the results screen can be shown at once.
export function DemoReset() {
  const router = useRouter();
  const { loadSample, t } = useSession();

  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") return null;

  return (
    <button
      type="button"
      onClick={() => {
        loadSample();
        router.push("/results");
      }}
      className="inline-flex min-h-12 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-ink"
    >
      <RotateCcw className="size-4" aria-hidden />
      {t("demo.resetToSample", { name: t(SAMPLE_NAME_KEY) })}
    </button>
  );
}
