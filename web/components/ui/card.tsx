import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border bg-surface p-4 shadow-[0_1px_0_rgba(20,33,61,0.04)]",
        className,
      )}
      {...props}
    />
  );
}
