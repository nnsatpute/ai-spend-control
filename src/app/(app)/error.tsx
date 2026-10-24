"use client";

import Link from "next/link";
import { useEffect } from "react";

const SERVICE_UNAVAILABLE = "Service unavailable";

function isServiceUnavailable(error: Error): boolean {
  const message = error.message ?? "";
  const name = error.name ?? "";

  return (
    message === SERVICE_UNAVAILABLE ||
    message.toLowerCase().includes("service unavailable") ||
    // Fallback if an unsanitized DB error still reaches the boundary
    message.includes("Can't reach database") ||
    message.includes("PrismaClient") ||
    name === "PrismaClientInitializationError" ||
    name.includes("Prisma")
  );
}

export default function AppErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const unavailable = isServiceUnavailable(error);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      <p className="font-mono-mc text-[11px] tracking-[0.22em] text-mc-ink-soft uppercase">
        {unavailable ? "503" : "Error"}
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-mc-ink">
        {unavailable ? SERVICE_UNAVAILABLE : "Something went wrong"}
      </h1>
      <p className="mt-4 text-base leading-relaxed text-mc-ink-soft">
        {unavailable
          ? "We’re temporarily unable to load this page. Please try again in a moment."
          : "Please try again. If the problem continues, come back later."}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="bg-mc-signal px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-mc-signal-deep"
        >
          Try again
        </button>
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
