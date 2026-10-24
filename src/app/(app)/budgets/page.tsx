import { getBudgetBoard } from "@/application/budget";
import { formatUsdFromCents, toDecimal } from "@/domain/common";
import { canManageBudgets } from "@/domain/organization";
import { BudgetsManager } from "@/components/budgets/budgets-manager";
import { ManagerCsvForm } from "@/components/budgets/manager-csv-form";
import { PageHeader } from "@/components/ui/page-header";
import { withOrgPage } from "@/lib/with-org-page";

function wholeDollars(cents: string | null): string {
  if (!cents) return "";
  return toDecimal(cents).dividedBy(100).toDecimalPlaces(0).toFixed(0);
}

export default async function BudgetsPage() {
  return withOrgPage(async ({ organization, role }) => {
    const board = await getBudgetBoard(organization.id);

    return (
      <div className="space-y-8">
        <PageHeader
          kicker="Budgets"
          title="Limits for this cycle"
          description="New budgets start in monitor mode: you see who would be capped before anything changes in Cursor. Switch to enforce when the numbers look right."
        />
        <BudgetsManager
          canManage={canManageBudgets(role)}
          slackConfigured={board.policy?.slackConfigured ?? false}
          defaultAmount={wholeDollars(board.policy?.defaultAmountCents ?? null)}
          mode={board.policy?.mode ?? "MONITOR"}
          actionAt100={board.policy?.actionAt100 ?? "ALERT"}
          rows={board.rows.map((row) => ({
            personId: row.personId,
            email: row.email,
            name: row.name,
            spendLabel: formatUsdFromCents(row.spendCents),
            amountDollars: wholeDollars(row.budgetCents),
            hasOwnBudget: row.hasOwnBudget,
            managerEmail: row.managerEmail,
            percent: row.percent,
            level: row.level,
            projectedLabel: row.projectedLabel,
          }))}
        />
        <ManagerCsvForm canManage={canManageBudgets(role)} />
      </div>
    );
  });
}
