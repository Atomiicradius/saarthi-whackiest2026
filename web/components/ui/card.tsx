import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(20,33,61,0.05),0_10px_28px_-16px_rgba(20,33,61,0.16)]",
        className,
      )}
      {...props}
    />
  );
}
