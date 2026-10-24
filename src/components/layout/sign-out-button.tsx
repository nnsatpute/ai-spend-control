"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-lg px-3 py-1.5 font-display text-sm font-medium text-mc-ink-soft transition hover:bg-mc-mist hover:text-mc-ink"
    >
      Sign out
    </button>
  );
}
