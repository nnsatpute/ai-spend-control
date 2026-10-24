import type { ReactNode } from "react";

type PanelProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  tone?: "default" | "ink";
};

export function Panel({
  title,
  description,
  children,
  className = "",
  bodyClassName = "",
  tone = "default",
}: PanelProps) {
  const shell =
    tone === "ink"
      ? "bg-mc-elevated"
      : "border border-mc-line bg-mc-surface shadow-[0_12px_40px_-24px_rgba(46,36,107,0.35)]";

  return (
    <section className={`overflow-hidden rounded-[20px] text-mc-ink ${shell} ${className}`}>
      <div className="px-6 pt-6 pb-4">
        <h2 className="font-display text-lg font-semibold tracking-tight text-mc-ink">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-mc-ink-soft">
            {description}
          </p>
        ) : null}
      </div>
      <div className={`px-6 pb-6 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
