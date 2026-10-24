import { AppError } from "@/domain/common";
import { canManageBudgets } from "@/domain/organization";
import { parseManagerCsv } from "@/domain/usage";
import { writeAuditLog } from "@/infrastructure/repositories/audit.repository";
import { setManagerByEmail } from "@/infrastructure/repositories/usage.repository";
import type { OrgContext } from "@/lib/org";

const MAX_ROWS = 500;

export async function importManagerCsv(
  ctx: OrgContext,
  csv: string,
): Promise<{ updated: number; missing: number; skipped: number }> {
  if (!canManageBudgets(ctx.role)) {
    throw new AppError("FORBIDDEN", "You don't have permission to update managers");
  }
  if (csv.length > 100_000) {
    throw new AppError("VALIDATION", "CSV is too large");
  }

  const parsed = parseManagerCsv(csv);
  if (parsed.rows.length > MAX_ROWS) {
    throw new AppError("VALIDATION", `Upload at most ${MAX_ROWS} people at a time`);
  }

  let updated = 0;
  let missing = 0;
  for (const row of parsed.rows) {
    const matched = await setManagerByEmail(ctx.organization.id, row.email, row.managerEmail);
    if (matched) {
      updated += 1;
    } else {
      missing += 1;
    }
  }

  await writeAuditLog({
    orgId: ctx.organization.id,
    actorId: ctx.userId,
    action: "managers.imported",
    detail: `${updated} updated, ${missing} not found, ${parsed.skipped} skipped`,
  });

  return { updated, missing, skipped: parsed.skipped };
}
