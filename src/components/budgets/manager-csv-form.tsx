"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Flash } from "@/components/ui/flash";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/ui/panel";

export function ManagerCsvForm({ canManage }: { canManage: boolean }) {
  const router = useRouter();
  const [csv, setCsv] = useState("email,managerEmail\n");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!canManage) {
    return null;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);
    try {
      const response = await fetch("/api/budgets/managers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload?.error?.message ?? "Could not import managers");
        return;
      }
      const data = payload.data as { updated: number; missing: number; skipped: number };
      setNotice(
        `Updated ${data.updated}. ${data.missing} emails were not in this workspace. ${data.skipped} rows skipped.`,
      );
      router.refresh();
    } catch {
      setError("Could not import managers");
    } finally {
      setPending(false);
    }
  }

  return (
    <Panel
      title="Managers"
      description="Upload email,managerEmail so the 90% warning goes to a manager instead of the account owner. People must already exist from a Cursor sync."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Flash message={notice} error={error} />
        <div className="space-y-2">
          <Label htmlFor="manager-csv">CSV</Label>
          <textarea
            id="manager-csv"
            value={csv}
            onChange={(event) => setCsv(event.target.value)}
            rows={6}
            className="w-full rounded-xl border border-mc-line bg-white px-3 py-2 font-mono-mc text-sm text-mc-ink"
            spellCheck={false}
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Importing…" : "Import managers"}
        </Button>
      </form>
    </Panel>
  );
}
