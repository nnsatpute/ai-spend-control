"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Logo } from "@/components/layout/logo";
import { SignOutButton } from "@/components/layout/sign-out-button";

const navItems = [
  { href: "/dashboard", label: "Spend" },
  { href: "/budgets", label: "Budgets" },
  { href: "/connections", label: "Connections" },
  { href: "/audit", label: "Audit" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  function go(href: string) {
    if (href === pathname) {
      return;
    }
    setPendingHref(href);
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-mc-paper text-mc-ink">
      <div className="pointer-events-none absolute -top-56 right-[-10%] h-[480px] w-[480px] rounded-full bg-mc-signal/10 blur-3xl" />
      <div className="pointer-events-none absolute top-40 left-[-15%] h-[420px] w-[420px] rounded-full bg-mc-accent/10 blur-3xl" />

      <header className="sticky top-0 z-30 border-b border-mc-line bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <Logo href="/dashboard" />
          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex flex-wrap gap-1 rounded-xl bg-mc-elevated p-1" aria-label="App sections">
              {navItems.map((item) => {
                const active = pathname === item.href;
                const loading = isPending && pendingHref === item.href;
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => go(item.href)}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-lg px-4 py-1.5 font-display text-sm font-medium transition ${
                      active
                        ? "bg-white text-mc-ink shadow-[0_2px_10px_-4px_rgba(46,36,107,0.35)]"
                        : loading
                          ? "bg-white/60 text-mc-ink"
                          : "text-mc-ink-soft hover:text-mc-ink"
                    }`}
                  >
                    {loading ? `${item.label}…` : item.label}
                  </button>
                );
              })}
            </nav>
            <SignOutButton />
          </div>
        </div>
        <div
          className={`h-0.5 w-full ${isPending ? "bg-mc-mist" : "bg-transparent"}`}
        >
          {isPending ? (
            <div className="h-full w-1/3 animate-pulse bg-gradient-to-r from-mc-signal to-mc-accent" />
          ) : null}
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        {children}
      </main>
    </div>
  );
}
