import type { ReactNode } from "react";

type PageHeaderProps = {
  kicker?: string;
  title: string;
  description: string;
  action?: ReactNode;
};

export function PageHeader({
  kicker,
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {kicker ? (
          <p className="font-display text-xs font-semibold tracking-[0.14em] text-mc-signal uppercase">
            {kicker}
          </p>
        ) : null}
        <h1 className="mt-2 font-display text-3xl font-normal tracking-tight text-mc-ink sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-mc-ink-soft">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
