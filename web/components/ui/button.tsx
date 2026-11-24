import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-[#0b2f30] disabled:opacity-50",
  secondary: "bg-surface text-ink border border-border hover:bg-bg disabled:opacity-50",
  ghost: "bg-transparent text-primary hover:bg-surface disabled:opacity-50",
};

// min-h-12 keeps every tap target at 48px or taller.
export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-2xl px-5 text-base font-semibold transition-colors",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
