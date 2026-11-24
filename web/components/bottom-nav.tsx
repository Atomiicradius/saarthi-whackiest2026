"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, ListChecks, Lock, ScrollText } from "lucide-react";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/", label: "Home", icon: House },
  { href: "/results", label: "Schemes", icon: ListChecks },
  { href: "/vault", label: "Vault", icon: Lock },
  { href: "/audit", label: "Audit", icon: ScrollText },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-[480px]">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold",
                  active ? "text-primary" : "text-muted",
                )}
              >
                <Icon className="size-6" aria-hidden />
                {label}
                <span
                  className={cn("h-1 w-6 rounded-full", active ? "bg-primary" : "bg-transparent")}
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
