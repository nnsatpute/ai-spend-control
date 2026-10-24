"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/ui/panel";
import { Flash } from "@/components/ui/flash";
import { StatusPill } from "@/components/ui/data-table";

export type CursorConnectionView = {
  status: "CONNECTED" | "ERROR";
  keyHint: string;
  memberCount: number;
  cycleStartLabel: string | null;
  lastSyncedLabel: string | null;
  lastError: string | null;
};

type Props = {
  connection: CursorConnectionView | null;
  canManage: boolean;
  canSync: boolean;
};

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const payload = await response.json();
    return payload?.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}

function membersLabel(count: number): string {
  return `${count} ${count === 1 ? "member" : "members"}`;
}

export function CursorConnectionManager({ connection, canManage, canSync }: Props) {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"connect" | "sync" | "disconnect" | null>(null);
  const [replacing, setReplacing] = useState(false);

  async function run(kind: "connect" | "sync" | "disconnect", action: () => Promise<void>) {
    setPending(kind);
    setError(null);
    setMessage(null);
    try {
      await action();
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setPending(null);
    }
  }

  function connect(event: React.FormEvent) {
    event.preventDefault();
    void run("connect", async () => {
      const response = await fetch("/api/connections/cursor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      if (!response.ok) {
        setError(await readError(response, "Could not connect Cursor"));
        return;
      }
      const payload = await response.json();
      setApiKey("");
      setReplacing(false);
      setMessage(`Connected, ${membersLabel(payload.data.memberCount)} found.`);
    });
  }

  function sync() {
    void run("sync", async () => {
      const response = await fetch("/api/connections/cursor/sync", { method: "POST" });
      if (!response.ok) {
        setError(await readError(response, "Sync failed"));
        return;
      }
      const payload = await response.json();
      setMessage(`Synced, ${membersLabel(payload.data.memberCount)}.`);
    });
  }

  function disconnect() {
    if (!window.confirm("Disconnect Cursor? The stored admin key is deleted. Spend history stays.")) {
      return;
    }
    void run("disconnect", async () => {
      const response = await fetch("/api/connections/cursor", { method: "DELETE" });
      if (!response.ok) {
        setError(await readError(response, "Could not disconnect"));
        return;
      }
      setMessage("Cursor disconnected and the admin key was deleted.");
    });
  }

  const showForm = canManage && (!connection || replacing);

  return (
    <Panel
      title="Cursor"
      description="Per-person spend for your Cursor Enterprise team, via the Cursor Admin API."
    >
      <div className="space-y-5">
        <Flash message={message} error={error} />

        {connection ? (
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-mc-ink-soft">Status</dt>
              <dd className="mt-1">
                <StatusPill tone={connection.status === "CONNECTED" ? "ok" : "bad"}>
                  {connection.status === "CONNECTED" ? "Connected" : "Error"}
                </StatusPill>
              </dd>
            </div>
            <div>
              <dt className="text-mc-ink-soft">Admin key</dt>
              <dd className="mt-1 font-mono-mc text-mc-ink">{connection.keyHint}</dd>
            </div>
            <div>
              <dt className="text-mc-ink-soft">Members</dt>
              <dd className="mt-1 text-mc-ink">{connection.memberCount}</dd>
            </div>
            <div>
              <dt className="text-mc-ink-soft">Last synced</dt>
              <dd className="mt-1 text-mc-ink">{connection.lastSyncedLabel ?? "Never"}</dd>
            </div>
            {connection.lastError ? (
              <p className="text-sm text-mc-danger sm:col-span-2 lg:col-span-4">
                {connection.lastError}
              </p>
            ) : null}
          </dl>
        ) : (
          <p className="text-sm text-mc-ink-soft">Not connected yet.</p>
        )}

        {connection ? (
          <div className="flex flex-wrap gap-2">
            {canSync ? (
              <Button type="button" onClick={sync} disabled={pending !== null}>
                {pending === "sync" ? "Syncing…" : "Sync now"}
              </Button>
            ) : null}
            {canManage && !replacing ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setReplacing(true)}
                disabled={pending !== null}
              >
                Replace key
              </Button>
            ) : null}
            {canManage ? (
              <Button
                type="button"
                variant="danger"
                onClick={disconnect}
                disabled={pending !== null}
              >
                {pending === "disconnect" ? "Disconnecting…" : "Disconnect"}
              </Button>
            ) : null}
          </div>
        ) : null}

        {showForm ? (
          <form onSubmit={connect} className="space-y-3 border-t border-mc-line pt-5">
            <div>
              <Label htmlFor="cursorKey">Cursor Admin API key</Label>
              <Input
                id="cursorKey"
                type="password"
                autoComplete="off"
                spellCheck={false}
                required
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="crsr_…"
              />
              <p className="mt-1 text-xs text-mc-ink-soft">
                As a team admin, open cursor.com/dashboard → API Keys → New API Key (scope
                admin:*). We check it with Cursor before saving, store it encrypted, and only read
                spend data.
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={pending !== null || apiKey.trim().length === 0}>
                {pending === "connect" ? "Checking key…" : connection ? "Save new key" : "Connect Cursor"}
              </Button>
              {replacing ? (
                <Button type="button" variant="ghost" onClick={() => setReplacing(false)}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        ) : null}

        {!canManage && !connection ? (
          <p className="text-sm text-mc-ink-soft">Ask an owner or admin to connect Cursor.</p>
        ) : null}
      </div>
    </Panel>
  );
}
