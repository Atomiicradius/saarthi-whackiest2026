"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { FileText, Lock, Upload } from "lucide-react";
import { LockAnimation } from "@/components/vault/lock-animation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { makeSampleFile } from "@/lib/sample-docs";
import { useSession } from "@/lib/session";
import { vault } from "@/lib/vault-adapter";

const MIN_PASSPHRASE = 8;
const MIN_ANIMATION_MS = 1500;

type Stage = "idle" | "passphrase" | "encrypting";

function formatSize(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

interface DocRowProps {
  docKey: string;
  neededFor: string[];
}

export function DocRow({ docKey, neededFor }: DocRowProps) {
  const { t, documents, addDocument } = useSession();
  const [stage, setStage] = useState<Stage>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [passphrase, setPassphrase] = useState("");
  const [failed, setFailed] = useState(false);
  const picker = useRef<HTMLInputElement>(null);

  const label = t(`docs.${docKey}`);
  const stored = documents.find((doc) => doc.docKey === docKey);
  const tooShort = passphrase.length < MIN_PASSPHRASE;

  function choose(next: File) {
    setFile(next);
    setFailed(false);
    setStage("passphrase");
  }

  function cancel() {
    setFile(null);
    setPassphrase("");
    setStage("idle");
  }

  async function encrypt(event: FormEvent) {
    event.preventDefault();
    if (!file || tooShort) return;
    setStage("encrypting");
    try {
      const [blob] = await Promise.all([
        vault.encryptFile(file, passphrase),
        new Promise((resolve) => setTimeout(resolve, MIN_ANIMATION_MS)),
      ]);
      addDocument({
        docKey,
        fileName: file.name,
        fileSize: file.size,
        mime: file.type || "application/octet-stream",
        blob,
      });
      cancel();
    } catch {
      setFailed(true);
      setStage("passphrase");
    }
  }

  return (
    <Card data-reveal className="space-y-3">
      <div className="flex items-start gap-3">
        <FileText className="mt-1 size-6 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-lg font-semibold first-letter:uppercase">{label}</h3>
          <p className="text-xs text-muted">
            {t("vault.needed", { schemes: neededFor.join(", ") })}
          </p>
        </div>
        {stored && stage === "idle" && (
          <Chip tone="success">
            <Lock className="size-3.5" aria-hidden />
            {t("vault.lockedBadge")}
          </Chip>
        )}
      </div>

      {stage === "encrypting" && (
        <div role="status" className="flex items-center gap-3 rounded-2xl bg-bg p-3">
          <LockAnimation />
          <p className="font-semibold">{t("vault.encrypting")}</p>
        </div>
      )}

      {stage === "idle" && stored && (
        <div className="space-y-3">
          <p role="status" className="font-semibold text-success">
            {t("vault.encrypted")}
          </p>
          <p className="text-xs text-muted">
            {t("vault.encryptedSize", { size: formatSize(stored.fileSize) })}
          </p>
          <Link
            href="/vault/server-view"
            className="inline-flex min-h-12 items-center rounded-full border border-border bg-bg px-4 text-sm font-semibold"
          >
            {t("vault.viewServer")}
          </Link>
        </div>
      )}

      {stage === "idle" && !stored && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => picker.current?.click()}>
              <Upload className="size-5" aria-hidden />
              {t("vault.add")}
            </Button>
            <Button variant="ghost" onClick={() => choose(makeSampleFile(docKey, label))}>
              {t("vault.useSample")}
            </Button>
          </div>
          <p className="text-xs text-muted">{t("vault.sampleNote")}</p>
          <input
            ref={picker}
            type="file"
            accept="image/*,application/pdf,text/plain"
            className="sr-only"
            tabIndex={-1}
            aria-label={t("vault.add")}
            onChange={(event) => {
              const chosen = event.target.files?.[0];
              if (chosen) choose(chosen);
              event.target.value = "";
            }}
          />
        </div>
      )}

      {stage === "passphrase" && file && (
        <form onSubmit={encrypt} className="space-y-3 rounded-2xl bg-bg p-3">
          <p className="text-sm font-semibold">{t("vault.choosePassphrase")}</p>
          <p className="text-xs text-muted">{t("vault.passphraseHelp")}</p>
          <label className="block">
            <span className="text-sm">{t("vault.passphraseLabel")}</span>
            <input
              type="password"
              value={passphrase}
              onChange={(event) => setPassphrase(event.target.value)}
              autoComplete="new-password"
              className="mt-1 min-h-12 w-full rounded-2xl border border-border bg-surface px-4 text-base"
            />
          </label>
          {passphrase.length > 0 && tooShort && (
            <p className="text-xs text-muted">{t("vault.passphraseShort")}</p>
          )}
          {failed && (
            <p role="alert" className="text-sm text-danger">
              {t("vault.failed")}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={tooShort}>
              <Lock className="size-5" aria-hidden />
              {t("vault.encrypt")}
            </Button>
            <Button variant="ghost" onClick={cancel}>
              {t("vault.cancel")}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
