type T = (path: string, vars?: Record<string, string | number>) => string;

const time = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

export function formatTime(iso: string): string {
  return time.format(new Date(iso));
}

// Purposes are stored as short codes. Any portal is shown as the sandbox replica, never a real one.
export function formatPurpose(purpose: string, t: T): string {
  if (purpose.startsWith("sandbox-portal:")) {
    return t("audit.sandboxPurpose", { scheme: purpose.slice("sandbox-portal:".length) });
  }
  if (purpose.startsWith("vault:")) return t("audit.vaultPurpose");
  return purpose;
}

export function shortHash(hash: string): string {
  return hash.slice(0, 8);
}
