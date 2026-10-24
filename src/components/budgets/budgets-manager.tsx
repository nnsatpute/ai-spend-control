"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/field";
import { Panel } from "@/components/ui/panel";
import { Flash } from "@/components/ui/flash";
import { DataRow, DataTable, StatusPill } from "@/components/ui/data-table";

export type BudgetRowView = {
  personId: string;
  email: string;
  name: string | null;
  spendLabel: string;
  amountDollars: string;
  hasOwnBudget: boolean;
  managerEmail: string;
  percent: number | null;
  level: 80 | 90 | 100 | null;
  projectedLabel: string | null;
};

type Props = {
  canManage: boolean;
  slackConfigured: boolean;
  defaultAmount: string;
  mode: "MONITOR" | "ENFORCE";
  actionAt100: "ALERT" | "CAP";
  rows: BudgetRowView[];
};

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const payload = await response.json();
    return payload?.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}

function levelTone(level: BudgetRowView["level"]): "ok" | "warn" | "bad" | "neutral" {
  if (level === 100) return "bad";
  if (level === 90) return "warn";
  if (level === 80) return "warn";
  return "ok";
}

export function BudgetsManager({
  canManage,
  slackConfigured,
  defaultAmount,
  mode,
  actionAt100,
  rows,
}: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState(defaultAmount);
  const [policyMode, setPolicyMode] = useState(mode);
  const [action, setAction] = useState(actionAt100);
  const [webhook, setWebhook] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { amount: string; manager: string }>>(() =>
    Object.fromEntries(rows.map((row) => [row.personId, { amount: row.amountDollars, manager: row.managerEmail }])),
  );

  async function savePolicy(event: React.FormEvent) {
    event.preventDefault();
    setPending("policy");
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/budgets/policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountDollars: amount,
          mode: policyMode,
          actionAt100: action,
          ...(webhook.trim() ? { slackWebhook: webhook.trim() } : {}),
        }),
      });
      if (!response.ok) {
        setError(await readError(response, "Could not save the budget"));
        return;
      }
      setWebhook("");
      setMessage("Budget saved. The next sync sends alerts.");
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPending(null);
    }
  }

  async function savePerson(personId: string) {
    const draft = drafts[personId];
    if (!draft) return;
    setPending(personId);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/budgets/person", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId,
          amountDollars: draft.amount,
          managerEmail: draft.manager,
        }),
      });
      if (!response.ok) {
        setError(await readError(response, "Could not update this person"));
        return;
      }
      setMessage("Updated. If enforcement is on, the Cursor cap was raised to match.");
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-8">
      <Flash message={message} error={error} />
      <Panel
        title="Company budget"
        description="Everyone uses this amount unless you set their own. Alerts go out on the next sync: the person at 80%, their manager at 90% and 100%."
      >
        <form onSubmit={savePolicy} className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="amount">Default monthly budget (USD)</Label>
            <Input
              id="amount"
              inputMode="numeric"
              required
              disabled={!canManage}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="mode">Mode</Label>
            <Select
              id="mode"
              disabled={!canManage}
              value={policyMode}
              onChange={(event) => setPolicyMode(event.target.value as "MONITOR" | "ENFORCE")}
            >
              <option value="MONITOR">Monitor — warn only</option>
              <option value="ENFORCE">Enforce — act at 100%</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="action">At 100%</Label>
            <Select
              id="action"
              disabled={!canManage}
              value={action}
              onChange={(event) => setAction(event.target.value as "ALERT" | "CAP")}
            >
              <option value="ALERT">Email only</option>
              <option value="CAP">Cap Cursor on-demand spend</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="slack">Slack webhook (optional)</Label>
            <Input
              id="slack"
              type="password"
              autoComplete="off"
              disabled={!canManage}
              placeholder={slackConfigured ? "Saved — paste a new URL to replace" : "https://hooks.slack.com/…"}
              value={webhook}
              onChange={(event) => setWebhook(event.target.value)}
            />
          </div>
          {canManage ? (
            <div className="sm:col-span-2">
              <Button type="submit" disabled={pending !== null}>
                {pending === "policy" ? "Saving…" : "Save budget"}
              </Button>
            </div>
          ) : null}
        </form>
      </Panel>

      <Panel
        title="People"
        description="Raise a person's budget here. In enforce mode the Cursor cap moves up with it, and never below what they've already spent."
        bodyClassName="!px-0 !pb-0"
      >
        <DataTable
          headers={["Person", "Spent", "Budget", "Manager", ""]}
          empty={rows.length === 0}
          emptyMessage="Sync Cursor first. People show up here after the first successful sync."
        >
          {rows.map((row) => {
            const draft = drafts[row.personId] ?? { amount: row.amountDollars, manager: row.managerEmail };
            return (
              <DataRow key={row.personId}>
                <td className="px-6 py-3.5">
                  <p className="font-semibold text-mc-ink">{row.name ?? row.email}</p>
                  {row.name ? <p className="text-xs text-mc-ink-soft">{row.email}</p> : null}
                  <div className="mt-1">
                    {row.percent === null ? (
                      <StatusPill>No budget</StatusPill>
                    ) : (
                      <StatusPill tone={levelTone(row.level)}>
                        {row.percent}%{row.projectedLabel ? ` · ${row.projectedLabel}` : ""}
                      </StatusPill>
                    )}
                  </div>
                </td>
                <td className="px-6 py-3.5 font-mono-mc text-mc-ink">{row.spendLabel}</td>
                <td className="px-6 py-3.5">
                  <Input
                    aria-label={`Budget for ${row.email}`}
                    inputMode="numeric"
                    disabled={!canManage}
                    value={draft.amount}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [row.personId]: { ...draft, amount: event.target.value },
                      }))
                    }
                  />
                  {!row.hasOwnBudget && row.amountDollars ? (
                    <p className="mt-1 text-xs text-mc-ink-soft">Using the company default</p>
                  ) : null}
                </td>
                <td className="px-6 py-3.5">
                  <Input
                    aria-label={`Manager for ${row.email}`}
                    type="email"
                    disabled={!canManage}
                    placeholder="manager@company.com"
                    value={draft.manager}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [row.personId]: { ...draft, manager: event.target.value },
                      }))
                    }
                  />
                </td>
                <td className="px-6 py-3.5">
                  {canManage ? (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pending !== null}
                      onClick={() => savePerson(row.personId)}
                    >
                      {pending === row.personId ? "Saving…" : "Update"}
                    </Button>
                  ) : null}
                </td>
              </DataRow>
            );
          })}
        </DataTable>
      </Panel>
    </div>
  );
}
