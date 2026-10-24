import type { ConnectionSummary } from "@/domain/connection";
import { sortBySpendDesc, summarizeSpend, type PersonSpendRow, type SpendSummary } from "@/domain/spend";
import { findConnectionSummary } from "@/infrastructure/repositories/connection.repository";
import { listSpendForCycle } from "@/infrastructure/repositories/spend.repository";

export type SpendOverview = {
  connection: ConnectionSummary | null;
  rows: PersonSpendRow[];
  summary: SpendSummary;
};

/** Current Cursor billing cycle: who is spending what. */
export async function getSpendOverview(orgId: string): Promise<SpendOverview> {
  const connection = await findConnectionSummary(orgId, "CURSOR");
  const rows = connection?.cycleStart
    ? sortBySpendDesc(await listSpendForCycle(orgId, "CURSOR", connection.cycleStart))
    : [];

  return { connection, rows, summary: summarizeSpend(rows) };
}
