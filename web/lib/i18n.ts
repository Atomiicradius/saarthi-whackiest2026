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

export function translate(locale: Locale, path: string, vars?: Vars): string {
  let node: unknown = dictionaries[locale];
  for (const key of path.split(".")) {
    node = node && typeof node === "object" ? (node as Record<string, unknown>)[key] : undefined;
  }
  const text = typeof node === "string" ? node : path;
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}
