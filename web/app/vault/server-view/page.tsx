"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Lock, LockOpen } from "lucide-react";
import { GuidePanel } from "@/components/guide/guide-panel";
import { CipherPane } from "@/components/vault/cipher-pane";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { useSession } from "@/lib/session";
import { useReveal } from "@/lib/use-reveal";
import { vault } from "@/lib/vault-adapter";

interface Unlocked {
  docKey: string;
  text: string | null;
  imageUrl: string | null;
}

// India Standard Time stamp in the audit-log format (section 8).
function nowIst(): string {
  return `${new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 19)}+05:30`;
}

export default function ServerViewPage() {
  const { t, documents, recordAudit } = useSession();
  const [chosen, setChosen] = useState<string | null>(null);
  const [passphrase, setPassphrase] = useState("");
  const [wrong, setWrong] = useState(false);
  const [unlocked, setUnlocked] = useState<Unlocked | null>(null);
  const container = useRef<HTMLElement>(null);
  useReveal(container, true);

  const doc = documents.find((item) => item.docKey === chosen) ?? documents[0];
  const isUnlocked = doc && unlocked?.docKey === doc.docKey ? unlocked : null;

  // Free the preview image when it is replaced or the page closes.
  useEffect(() => {
    const url = unlocked?.imageUrl;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [unlocked]);

  async function unlock(event: FormEvent) {
    event.preventDefault();
    if (!doc) return;
    try {
      const plain = await vault.decryptBlob(doc.blob, passphrase);
      const typed = new Blob([plain], { type: doc.mime });
      setUnlocked({
        docKey: doc.docKey,
        text: doc.mime.startsWith("text/") ? await typed.text() : null,
        imageUrl: doc.mime.startsWith("image/") ? URL.createObjectURL(typed) : null,
      });
      setWrong(false);
      // The log records which document was read and why, never what was in it.
      await recordAudit({
        ts: nowIst(),
        actor: "user",
        action: "read",
        fields: [doc.docKey],
        purpose: "vault:preview-on-device",
      });
    } catch {
      setWrong(true);
    } finally {
      setPassphrase("");
    }
  }

  if (!doc) {
    return (
      <main className="py-16 text-center">
        <h1 className="font-serif text-3xl font-semibold">{t("serverView.title")}</h1>
        <p className="mt-3 text-soft">{t("serverView.empty")}</p>
        <Link
          href="/vault"
          className="mt-4 inline-flex min-h-12 items-center rounded-2xl bg-primary px-5 font-semibold text-white"
        >
          {t("serverView.goVault")}
        </Link>
      </main>
    );
  }

  return (
    <main ref={container}>
      <div className="mb-6 max-w-3xl">
        <GuidePanel variant="strip" state="idle" message={t("serverView.guide")} />
      </div>
      <h1 data-reveal className="font-serif text-3xl font-semibold leading-tight lg:text-4xl">
        {t("serverView.title")}
      </h1>

      {documents.length > 1 && (
        <div
          role="group"
          aria-label={t("serverView.selectDoc")}
          className="mt-3 flex flex-wrap gap-2"
        >
          {documents.map((item) => (
            <button
              key={item.docKey}
              type="button"
              aria-pressed={item.docKey === doc.docKey}
              onClick={() => {
                setChosen(item.docKey);
                setWrong(false);
              }}
              className={cn(
                "min-h-12 rounded-full border px-4 text-sm font-semibold first-letter:uppercase",
                item.docKey === doc.docKey
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface",
              )}
            >
              {t(`docs.${item.docKey}`)}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card data-reveal className="space-y-3">
          <div className="flex items-center gap-2">
            <LockOpen className="size-5 text-primary" aria-hidden />
            <h2 className="font-serif text-lg font-semibold">{t("serverView.yourDevice")}</h2>
          </div>

          {isUnlocked ? (
            <div className="space-y-2">
              {isUnlocked.text !== null && (
                <pre
                  data-lenis-prevent
                  className="max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl bg-bg p-4 text-sm"
                >
                  {isUnlocked.text}
                </pre>
              )}
              {isUnlocked.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- a local blob URL, not a remote image
                <img
                  src={isUnlocked.imageUrl}
                  alt={t(`docs.${doc.docKey}`)}
                  className="max-h-72 w-full rounded-2xl bg-bg object-contain"
                />
              )}
              {isUnlocked.text === null && !isUnlocked.imageUrl && (
                <p className="rounded-2xl bg-bg p-4 text-sm text-soft">
                  {t("serverView.noPreview")}
                </p>
              )}
              <p className="text-xs text-soft">{t("serverView.readable")}</p>
            </div>
          ) : (
            <form onSubmit={unlock} className="space-y-3 rounded-2xl bg-bg p-4">
              <p className="flex items-start gap-2 text-sm">
                <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
                {t("serverView.locked")}
              </p>
              <label className="block">
                <span className="text-sm">{t("vault.passphraseLabel")}</span>
                <input
                  type="password"
                  value={passphrase}
                  onChange={(event) => setPassphrase(event.target.value)}
                  autoComplete="off"
                  className="mt-1 min-h-12 w-full rounded-2xl border border-border bg-surface px-4 text-base"
                />
              </label>
              {wrong && (
                <p role="alert" className="text-sm text-danger">
                  {t("serverView.wrongPassphrase")}
                </p>
              )}
              <Button type="submit" disabled={passphrase.length === 0}>
                {t("serverView.unlock")}
              </Button>
            </form>
          )}
        </Card>

        <Card data-reveal className="space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="size-5 text-primary" aria-hidden />
            <h2 className="font-serif text-lg font-semibold">{t("serverView.onServer")}</h2>
          </div>
          <CipherPane ciphertextBase64={doc.blob.data.ciphertext} />
          <p className="font-semibold">{t("serverView.serverCaption")}</p>
          <p className="text-xs text-soft">
            {t("serverView.alsoStored")} {t("serverView.neverStored")}
          </p>
        </Card>
      </div>
    </main>
  );
}
