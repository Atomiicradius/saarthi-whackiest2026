"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GuidePanel } from "@/components/guide/guide-panel";
import { LanguageChips } from "@/components/interview/language-chips";
import { PageColumns } from "@/components/page-columns";
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
    <PageColumns
      ref={container}
      guide={<GuidePanel state="idle" message={t("landing.guideHello")} showMic />}
    >
      <div className="max-w-2xl space-y-6 lg:pt-6">
        <h1
          data-reveal
          className="font-serif text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl"
        >
          {t("landing.headline")}
        </h1>
        <p data-reveal className="text-soft max-w-xl text-lg">
          {t("landing.pitch")}
        </p>

        <div data-reveal>
          <LanguageChips />
        </div>

        <div data-reveal className="space-y-3 pt-2">
          <Button className="w-full sm:w-auto sm:min-w-64" onClick={startAsRavi}>
            {t("landing.startAsRavi")}
          </Button>
          <p className="text-soft text-xs">{t("landing.raviNote")}</p>
          <Link
            href="/interview"
            className="inline-flex min-h-12 items-center text-sm font-semibold text-primary underline underline-offset-4"
          >
            {t("landing.answerMyself")}
          </Link>
        </div>
      </div>
    </PageColumns>
  );
}
