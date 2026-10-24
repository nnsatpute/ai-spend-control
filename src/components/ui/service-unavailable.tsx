import Link from "next/link";

/** Safe, customer-facing outage screen — no infrastructure details. */
export function ServiceUnavailable() {
  return (
    <div className="mx-auto flex min-h-[55vh] max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      <p className="font-mono-mc text-[11px] tracking-[0.22em] text-mc-ink-soft uppercase">
        503
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-mc-ink">
        Service unavailable
      </h1>
      <p className="mt-4 text-base leading-relaxed text-mc-ink-soft">
        We’re temporarily unable to load this page. Please try again in a
        moment.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg bg-mc-signal px-5 py-2.5 font-display text-sm font-medium text-white transition hover:bg-mc-signal-deep"
        >
          Try again
        </Link>
        <Link
          href="/"
          className="border border-mc-line bg-mc-surface px-5 py-2.5 text-sm font-medium text-mc-ink transition hover:bg-mc-mist"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
