"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session";

interface StepperInputProps {
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
  onUse: () => void;
}

// Tap-to-answer for numbers (income, marks): big +/- buttons, then "Use this answer".
export function StepperInput({
  value,
  min,
  max,
  step,
  display,
  onChange,
  onUse,
}: StepperInputProps) {
  const { t } = useSession();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-3xl border border-border bg-surface p-3">
        <Button
          variant="secondary"
          aria-label={t("interview.stepperDown")}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - step))}
        >
          <Minus className="size-6" aria-hidden />
        </Button>
        <output aria-live="polite" className="font-serif text-3xl font-semibold">
          {display}
        </output>
        <Button
          variant="secondary"
          aria-label={t("interview.stepperUp")}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + step))}
        >
          <Plus className="size-6" aria-hidden />
        </Button>
      </div>
      <Button className="w-full" onClick={onUse}>
        {t("interview.useThis")}
      </Button>
    </div>
  );
}
