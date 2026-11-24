import type { ReactNode, Ref } from "react";

interface PageColumnsProps {
  /** Left column on desktop (sticky), a compact row at the top on phones. */
  guide: ReactNode;
  children: ReactNode;
  ref?: Ref<HTMLElement>;
}

export function PageColumns({ guide, children, ref }: PageColumnsProps) {
  return (
    <main
      ref={ref}
      className="lg:grid lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)] lg:items-start lg:gap-10"
    >
      <aside className="lg:sticky lg:top-24">{guide}</aside>
      <div className="mt-5 min-w-0 lg:mt-0">{children}</div>
    </main>
  );
}
