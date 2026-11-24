"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { NAV_TABS } from "@/lib/nav";
import { useSession } from "@/lib/session";

// Desktop navigation: a pill bar in the header. Phones keep the bottom bar.
export function TopNav() {
  const { t } = useSession();
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="hidden rounded-full border border-border bg-surface/90 p-1 shadow-[0_8px_24px_-14px_rgba(20,33,61,0.2)] lg:block"
    >
      <ul className="flex gap-1">
        {NAV_TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors",
                  active ? "bg-primary text-white" : "text-ink hover:bg-bg",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {t(label)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
