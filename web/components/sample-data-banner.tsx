import { Info } from "lucide-react";
import type { Scheme } from "@/lib/types";

// Shown whenever any scheme is placeholder data, so nobody mistakes it for a real scheme.
export function SampleDataBanner({ schemes, text }: { schemes: Scheme[]; text: string }) {
  if (!schemes.some((scheme) => scheme.name.startsWith("EXAMPLE"))) return null;
  return (
    <div
      role="note"
      data-reveal
      className="mb-4 flex items-start gap-2 rounded-2xl bg-amber px-4 py-3 text-sm font-semibold text-ink"
    >
      <Info className="mt-0.5 size-5 shrink-0" aria-hidden />
      <span>{text}</span>
    </div>
  );
}
