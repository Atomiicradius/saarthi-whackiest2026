import { SAMPLE_NAME_KEY } from "@/lib/sample-student";
import { Award, Lock, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";

type T = (path: string, vars?: Record<string, string | number>) => string;

const STEPS = [
  { icon: Mic, title: "landing.how.step1", body: "landing.how.step1Body" },
  { icon: Award, title: "landing.how.step2", body: "landing.how.step2Body" },
  { icon: Lock, title: "landing.how.step3", body: "landing.how.step3Body" },
];

const DIFFERENCES = [
  "landing.diff.nearMiss",
  "landing.diff.planner",
  "landing.diff.vault",
  "landing.diff.audit",
];

// Below the landing hero. Plain wording, no statistics.
export function HowItWorks({ t, onStart }: { t: T; onStart: () => void }) {
  return (
    <section aria-labelledby="how-title" className="mt-20 lg:mt-28">
      <h2
        id="how-title"
        data-reveal
        className="font-serif text-3xl font-semibold leading-tight lg:text-4xl"
      >
        {t("landing.how.title")}
      </h2>

      <ol className="mt-6 grid gap-4 md:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, body }, index) => (
          <li key={title} data-reveal>
            <Card className="h-full space-y-3 p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-white">
                  <Icon className="size-6" aria-hidden />
                </span>
                <span className="font-serif text-lg font-semibold text-primary">{index + 1}</span>
              </div>
              <h3 className="font-serif text-xl font-semibold leading-snug">{t(title)}</h3>
              <p className="text-soft text-sm">{t(body)}</p>
            </Card>
          </li>
        ))}
      </ol>

      <div data-reveal className="mt-10">
        <h2 className="font-serif text-lg font-semibold">{t("landing.diff.title")}</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {DIFFERENCES.map((key) => (
            <li key={key}>
              <Chip className="px-4 py-2 text-sm">{t(key)}</Chip>
            </li>
          ))}
        </ul>
      </div>

      <div data-reveal className="mb-8 mt-10 flex flex-col items-start gap-2">
        <Button className="w-full sm:w-auto sm:min-w-64" onClick={onStart}>
          {t("landing.startAgain", { name: t(SAMPLE_NAME_KEY) })}
        </Button>
        <p className="text-soft text-xs">{t("landing.sampleNote", { name: t(SAMPLE_NAME_KEY) })}</p>
      </div>
    </section>
  );
}
