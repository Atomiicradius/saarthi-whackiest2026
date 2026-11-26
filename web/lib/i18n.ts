import en from "@/i18n/en.json";
import hi from "@/i18n/hi.json";
import kn from "@/i18n/kn.json";

export type Locale = "en" | "hi" | "kn";

export const LANGUAGE_CHIPS: { locale: Locale; label: string }[] = [
  { locale: "kn", label: "ಕನ್ನಡ" },
  { locale: "hi", label: "हिन्दी" },
  { locale: "en", label: "English" },
];

const dictionaries: Record<Locale, unknown> = { en, hi, kn };

type Vars = Record<string, string | number>;

function lookup(locale: Locale, path: string): string | undefined {
  let node: unknown = dictionaries[locale];
  for (const key of path.split(".")) {
    node = node && typeof node === "object" ? (node as Record<string, unknown>)[key] : undefined;
  }
  return typeof node === "string" ? node : undefined;
}

// A missing label falls back to English, then to a readable form of its last word, so the raw key
// (for example "docs.domicile_certificate") is never shown to a student.
function readable(path: string): string {
  return (path.split(".").pop() ?? path).replace(/_/g, " ");
}

export function translate(locale: Locale, path: string, vars?: Vars): string {
  const text = lookup(locale, path) ?? lookup("en", path) ?? readable(path);
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}
