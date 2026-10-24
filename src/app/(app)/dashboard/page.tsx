import Link from "next/link";
import { getBudgetBoard } from "@/application/budget";
import { getSpendOverview } from "@/application/spend";
import { getUsageTrend } from "@/application/usage/usage.service";
import { formatUsdFromCents } from "@/domain/common";
import { isAtLimit } from "@/domain/spend";
import { DataRow, DataTable, StatusPill } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { formatDate, formatDateTime } from "@/lib/format";
import { withOrgPage } from "@/lib/with-org-page";

function UsageTrend({ points }: { points: { day: string; requests: number }[] }) {
  const max = Math.max(1, ...points.map((point) => point.requests));
  return (
    <Panel
      title="14-day usage"
      description="Usage-based requests per day across the team. Cursor’s daily history does not include dollar amounts."
    >
      {points.length === 0 ? (
        <p className="text-sm text-mc-ink-soft">
          No daily history yet. It fills in on the next sync.
        </p>
      ) : (
        <div className="flex h-36 items-end gap-1.5">
          {points.map((point) => (
            <div key={point.day} className="flex h-full min-w-0 flex-1 flex-col justify-end">
              <div
                className="rounded-t-md bg-mc-accent"
                style={{ height: `${Math.max(4, (point.requests / max) * 100)}%` }}
                title={`${point.day}: ${point.requests}`}
              />
              <p className="mt-2 truncate text-center text-[10px] text-mc-ink-soft">{point.day.slice(5)}</p>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function Stat({
  label,
  value,
  hint,
  highlight = false,
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-[20px] p-5 ${
        highlight
          ? "bg-mc-ink text-white shadow-[0_18px_40px_-20px_rgba(46,36,107,0.7)]"
          : "border border-mc-line bg-mc-surface text-mc-ink"
      }`}
    >
      <p className={`text-xs font-semibold tracking-wide uppercase ${highlight ? "text-white/70" : "text-mc-ink-soft"}`}>
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-semibold tracking-tight">{value}</p>
      {hint ? (
        <p className={`mt-1 text-xs ${highlight ? "text-white/70" : "text-mc-ink-soft"}`}>{hint}</p>
      ) : null}
    </div>
  );
}

export default async function DashboardPage() {
  return withOrgPage(async ({ organization }) => {
    const [{ connection, rows, summary }, board, trend] = await Promise.all([
      getSpendOverview(organization.id),
      getBudgetBoard(organization.id),
      getUsageTrend(organization.id),
    ]);
    const budgetByPerson = new Map(board.rows.map((row) => [row.personId, row]));

    if (!connection) {
      return (
        <div className="space-y-8">
          <PageHeader
            kicker="Spend"
            title={organization.name}
            description="See who is spending what on AI tools this billing cycle."
          />
          <Panel title="Connect Cursor to get started" description="Takes about two minutes.">
            <ol className="list-decimal space-y-2 pl-5 text-sm text-mc-ink-soft">
              <li>As a Cursor team admin, open cursor.com/dashboard → API Keys.</li>
              <li>Click New API Key (scope admin:*) and copy it. Cursor only shows it once.</li>
              <li>
                Paste it on the{" "}
                <Link href="/connections" className="font-semibold text-mc-signal hover:underline">
                  Connections
                </Link>{" "}
                page. We check it with Cursor before saving.
              </li>
            </ol>
          </Panel>
        </div>
      );
    }

    const cycle = formatDate(connection.cycleStart);

    return (
      <div className="space-y-8">
        <PageHeader
          kicker="Spend"
          title={organization.name}
          description={`Cursor billing cycle${cycle ? ` started ${cycle}` : ""}. Last synced ${formatDateTime(connection.lastSyncedAt) ?? "never"}.`}
        />

        {connection.status === "ERROR" ? (
          <p className="rounded-xl border border-mc-danger/25 bg-mc-danger/10 px-4 py-3 text-sm text-mc-danger">
            Last sync failed: {connection.lastError}{" "}
            <Link href="/connections" className="font-semibold underline">
              Fix on Connections
            </Link>
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="On-demand spend"
            value={formatUsdFromCents(summary.totalSpendCents)}
            hint="Beyond included usage, this cycle"
            highlight
          />
          <Stat
            label="Total usage value"
            value={formatUsdFromCents(summary.totalOverallSpendCents)}
            hint="Including included usage"
          />
          <Stat
            label="People spending"
            value={`${summary.spendingPeopleCount} / ${summary.peopleCount}`}
          />
          <Stat
            label="Top 3 share"
            value={summary.top3Share === null ? "—" : `${Math.round(summary.top3Share * 100)}%`}
            hint={summary.atLimitCount > 0 ? `${summary.atLimitCount} at their Cursor cap` : undefined}
          />
        </div>

        <UsageTrend points={trend} />

        <Panel title="People" description="Sorted by on-demand spend this cycle." bodyClassName="!px-0 !pb-0">
          <DataTable
            headers={["Person", "On-demand", "Budget", "Total usage", "Cursor cap"]}
            empty={rows.length === 0}
            emptyMessage="No members returned by Cursor yet. Try Sync now on Connections."
          >
            {rows.map((row) => {
              const atCap = isAtLimit(row);
              const budget = budgetByPerson.get(row.personId);
              return (
                <DataRow key={row.personId}>
                  <td className="px-6 py-3.5">
                    <p className="font-semibold text-mc-ink">{row.name ?? row.email}</p>
                    {row.name ? <p className="text-xs text-mc-ink-soft">{row.email}</p> : null}
                  </td>
                  <td className="px-6 py-3.5 font-mono-mc text-mc-ink">
                    {formatUsdFromCents(row.spendCents)}
                  </td>
                  <td className="px-6 py-3.5">
                    {budget?.percent === null || budget?.percent === undefined ? (
                      <Link href="/budgets" className="text-sm font-semibold text-mc-signal hover:underline">
                        Set a budget
                      </Link>
                    ) : (
                      <StatusPill tone={budget.level === 100 ? "bad" : budget.level ? "warn" : "ok"}>
                        {budget.percent}% of {formatUsdFromCents(budget.budgetCents ?? "0")}
                      </StatusPill>
                    )}
                  </td>
                  <td className="px-6 py-3.5 font-mono-mc text-mc-ink-soft">
                    {formatUsdFromCents(row.overallSpendCents)}
                  </td>
                  <td className="px-6 py-3.5">
                    {row.effectiveLimitCents === null ? (
                      <StatusPill>None</StatusPill>
                    ) : (
                      <StatusPill tone={atCap ? "bad" : "neutral"}>
                        {formatUsdFromCents(row.effectiveLimitCents)}
                      </StatusPill>
                    )}
                  </td>
                </DataRow>
              );
            })}
          </DataTable>
        </Panel>
      </div>
    );
  });
}
