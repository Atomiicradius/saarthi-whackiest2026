"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LanguageChips } from "@/components/interview/language-chips";
import { MicOrb } from "@/components/interview/mic-orb";
import { Waveform } from "@/components/landing/waveform";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session";
import { useStaggerReveal } from "@/lib/use-stagger-reveal";

export default function LandingPage() {
  const router = useRouter();
  const { t, restart, setPersona } = useSession();
  const container = useRef<HTMLElement>(null);
  useStaggerReveal(container, true);

  function startAsRavi() {
    restart();
    setPersona("ravi");
    router.push("/interview");
  }

  return (
    <main
      ref={container}
      className="mx-auto flex max-w-[480px] flex-col items-center gap-6 pt-2 text-center"
    >
      <p
        data-reveal
        className="font-serif text-sm font-semibold uppercase tracking-wide text-primary"
      >
        {t("app.name")}
      </p>

      <h1 data-reveal className="font-serif text-4xl font-semibold leading-tight">
        {t("landing.headline")}
      </h1>
      <p data-reveal className="max-w-sm text-muted">
        {t("landing.pitch")}
      </p>

      <div data-reveal className="flex flex-col items-center">
        <Waveform />
        <div className="-mt-2">
          <MicOrb size="lg" />
        </div>
      </div>

      <div data-reveal className="w-full">
        <LanguageChips />
      </div>

      <div data-reveal className="w-full space-y-3">
        <Button className="w-full" onClick={startAsRavi}>
          {t("landing.startAsRavi")}
        </Button>
        <p className="text-xs text-muted">{t("landing.raviNote")}</p>
        <Link
          href="/interview"
          className="inline-flex min-h-12 items-center justify-center text-sm font-semibold text-primary underline underline-offset-4"
        >
          {t("landing.answerMyself")}
        </Link>
      </div>
    </main>
  );
}
