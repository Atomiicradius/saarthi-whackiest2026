import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ChipTone = "neutral" | "primary" | "success" | "danger" | "amber";

// Amber and the tinted tones always carry dark text. Amber is never used as text on white.
const TONES: Record<ChipTone, string> = {
  neutral: "bg-bg border-border text-ink",
  primary: "bg-primary border-primary text-white",
  success: "bg-[#dcefe5] border-[#bcdccb] text-ink",
  danger: "bg-[#f6ddd8] border-[#e6bdb4] text-ink",
  amber: "bg-amber border-amber text-ink",
};

export function Chip({
  tone = "neutral",
  className,
  children,
}: {
  tone?: ChipTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
