import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5">
      <span
        aria-hidden
        className="relative grid h-9 w-9 place-items-center rounded-xl bg-mc-ink text-white transition group-hover:rotate-[-4deg]"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M5 18 L10 11 L14 14 L19 6" />
        </svg>
        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-mc-signal ring-2 ring-mc-paper" />
      </span>
      <span className="font-display text-base font-semibold tracking-tight text-mc-ink">
        {APP_NAME}
      </span>
    </Link>
  );
}
