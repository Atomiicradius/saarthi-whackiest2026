import { House, ListChecks, Lock, ScrollText } from "lucide-react";

export const NAV_TABS = [
  { href: "/", label: "Home", icon: House },
  { href: "/results", label: "Schemes", icon: ListChecks },
  { href: "/vault", label: "Vault", icon: Lock },
  { href: "/audit", label: "Audit", icon: ScrollText },
];
