import { AppError, isAppError } from "@/domain/common";
import { adminKeySchema, keyHint, type ConnectionSummary } from "@/domain/connection";
import { canManageConnections, canSyncConnections } from "@/domain/organization";
import { decryptSecret, encryptSecret } from "@/infrastructure/crypto/secret-box";
import { fetchCursorSpend } from "@/infrastructure/providers/cursor/client";
import { writeAuditLog } from "@/infrastructure/repositories/audit.repository";
import {
  deleteConnection,
  findConnectionSummary,
  findEncryptedKey,
  markConnectionError,
  markConnectionSynced,
  upsertConnection,
} from "@/infrastructure/repositories/connection.repository";
import { saveSpendReport } from "@/infrastructure/repositories/spend.repository";
import { applyBudgets } from "@/application/budget";
import { syncDailyUsage } from "@/application/usage/usage.service";
import type { OrgContext } from "@/lib/org";

async function runBudgets(orgId: string, apiKey: string, cycleStart: Date): Promise<void> {
  try {
    await applyBudgets({ orgId, apiKey, cycleStart });
  } catch (error) {
    console.error("[budget] policy run failed", error);
  }
}

async function runDailyUsage(orgId: string, apiKey: string): Promise<void> {
  try {
    await syncDailyUsage(orgId, apiKey);
  } catch (error) {
    console.error("[usage] daily history failed", error);
  }
}

export type SyncResult = { memberCount: number; syncedAt: Date };

/**
 * Validates the key with a live call to Cursor before storing anything,
 * then stores it encrypted and saves the first spend snapshot.
 */
export async function connectCursor(ctx: OrgContext, rawKey: unknown): Promise<SyncResult> {
  if (!canManageConnections(ctx.role)) {
    throw new AppError("FORBIDDEN", "Only owners and admins can connect providers");
  }

  const parsed = adminKeySchema.safeParse(rawKey);
  if (!parsed.success) {
    throw new AppError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid admin key");
  }
  const apiKey = parsed.data;

  const report = await fetchCursorSpend(apiKey);
  const syncedAt = new Date();
  const orgId = ctx.organization.id;

  await upsertConnection({
    orgId,
    provider: "CURSOR",
    encryptedKey: encryptSecret(apiKey),
    keyHint: keyHint(apiKey),
  });
  await saveSpendReport({ orgId, provider: "CURSOR", report, syncedAt });
  await markConnectionSynced({
    orgId,
    provider: "CURSOR",
    memberCount: report.members.length,
    cycleStart: report.cycleStart,
    syncedAt,
  });
  await runBudgets(orgId, apiKey, report.cycleStart);
  await runDailyUsage(orgId, apiKey);
  await writeAuditLog({
    orgId,
    actorId: ctx.userId,
    action: "connection.connected",
    detail: `Cursor key ${keyHint(apiKey)}; ${report.members.length} members`,
  });

  return { memberCount: report.members.length, syncedAt };
}

/** Pulls current-cycle spend with the stored key. Used by "Sync now" and (later) the hourly cron. */
export async function syncCursorForOrg(orgId: string): Promise<SyncResult> {
  const encrypted = await findEncryptedKey(orgId, "CURSOR");
  if (!encrypted) {
    throw new AppError("NOT_FOUND", "Cursor is not connected");
  }

  let apiKey: string;
  try {
    apiKey = decryptSecret(encrypted);
  } catch (error) {
    console.error("[connection] cannot decrypt stored key", error);
    await markConnectionError(orgId, "CURSOR", "Stored key could not be read. Reconnect Cursor.");
    throw new AppError("DOMAIN_RULE", "Stored key could not be read. Reconnect Cursor.");
  }

  try {
    const report = await fetchCursorSpend(apiKey);
    const syncedAt = new Date();
    await saveSpendReport({ orgId, provider: "CURSOR", report, syncedAt });
    await markConnectionSynced({
      orgId,
      provider: "CURSOR",
      memberCount: report.members.length,
      cycleStart: report.cycleStart,
      syncedAt,
    });
    await runBudgets(orgId, apiKey, report.cycleStart);
    await runDailyUsage(orgId, apiKey);
    return { memberCount: report.members.length, syncedAt };
  } catch (error) {
    if (isAppError(error) && (error.code === "VALIDATION" || error.code === "UPSTREAM")) {
      await markConnectionError(orgId, "CURSOR", error.message);
    }
    throw error;
  }
}

export async function syncCursor(ctx: OrgContext): Promise<SyncResult> {
  if (!canSyncConnections(ctx.role)) {
    throw new AppError("FORBIDDEN", "You don't have permission to sync");
  }
  return syncCursorForOrg(ctx.organization.id);
}

export async function disconnectCursor(ctx: OrgContext): Promise<void> {
  if (!canManageConnections(ctx.role)) {
    throw new AppError("FORBIDDEN", "Only owners and admins can disconnect providers");
  }
  await deleteConnection(ctx.organization.id, "CURSOR");
  await writeAuditLog({
    orgId: ctx.organization.id,
    actorId: ctx.userId,
    action: "connection.disconnected",
    detail: "Cursor key deleted",
  });
}

export async function getCursorConnection(orgId: string): Promise<ConnectionSummary | null> {
  return findConnectionSummary(orgId, "CURSOR");
}
