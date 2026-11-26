import { SchemeCard } from "@/components/results/scheme-card";
import { Chip, type ChipTone } from "@/components/ui/chip";
import type { SchemeView } from "@/lib/results-model";

type T = (path: string, vars?: Record<string, string | number>) => string;

interface LaneProps {
  title: string;
  tone: ChipTone;
  views: SchemeView[];
  t: T;
}

export function Lane({ title, tone, views, t }: LaneProps) {
  if (views.length === 0) return null;
  return (
    <section aria-label={title} className="mt-8">
      <div data-reveal className="flex items-center gap-3">
        <h2 className="font-serif text-2xl font-semibold lg:text-3xl">{title}</h2>
        <Chip tone={tone}>{views.length}</Chip>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {views.map((view) => (
          <SchemeCard key={view.scheme.id} view={view} t={t} />
        ))}
      </div>
    </section>
  );
}
