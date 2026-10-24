import type { ReactNode } from "react";
import { Logo } from "@/components/layout/logo";

export function AuthShell({
  title,
  accent,
  subtitle,
  children,
}: {
  title: string;
  /** Optional word rendered in the bold serif before the title. */
  accent?: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-mc-paper px-6 py-10">
      <div className="pointer-events-none absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-mc-signal/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -left-40 h-[520px] w-[520px] rounded-full bg-mc-accent/15 blur-3xl" />

      <div className="relative mx-auto max-w-md">
        <Logo />
        <div className="mt-10 rounded-[24px] bg-mc-surface p-8 shadow-[0_24px_60px_-30px_rgba(46,36,107,0.45)]">
          <h1 className="font-display text-3xl font-normal tracking-tight text-mc-ink">
            {accent ? <span className="font-accent">{accent} </span> : null}
            {title}
          </h1>
          <p className="mt-2 text-sm text-mc-ink-soft">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
