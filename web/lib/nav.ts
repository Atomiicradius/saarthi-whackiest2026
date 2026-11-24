import { House, ListChecks, Lock, ScrollText } from "lucide-react";

// `label` is an i18n key.
export const NAV_TABS = [
  { href: "/", label: "nav.home", icon: House },
  { href: "/results", label: "nav.schemes", icon: ListChecks },
  { href: "/vault", label: "nav.vault", icon: Lock },
  { href: "/audit", label: "nav.audit", icon: ScrollText },
];
