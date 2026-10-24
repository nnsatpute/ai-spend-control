import { prisma } from "@/infrastructure/db";
import type { ConnectionSummary, Provider } from "@/domain/connection";

const summarySelect = {
  provider: true,
  status: true,
  keyHint: true,
  memberCount: true,
  cycleStart: true,
  lastSyncedAt: true,
  lastError: true,
} as const;

export async function findConnectionSummary(
  orgId: string,
  provider: Provider,
): Promise<ConnectionSummary | null> {
  return prisma.connection.findUnique({
    where: { orgId_provider: { orgId, provider } },
    select: summarySelect,
  });
}

/** Only sync/enforcement code may call this. Never pass the result to the UI or logs. */
export async function findEncryptedKey(orgId: string, provider: Provider): Promise<string | null> {
  const record = await prisma.connection.findUnique({
    where: { orgId_provider: { orgId, provider } },
    select: { encryptedKey: true },
  });
  return record?.encryptedKey ?? null;
}

export async function upsertConnection(input: {
  orgId: string;
  provider: Provider;
  encryptedKey: string;
  keyHint: string;
}): Promise<void> {
  await prisma.connection.upsert({
    where: { orgId_provider: { orgId: input.orgId, provider: input.provider } },
    create: {
      orgId: input.orgId,
      provider: input.provider,
      encryptedKey: input.encryptedKey,
      keyHint: input.keyHint,
    },
    update: {
      encryptedKey: input.encryptedKey,
      keyHint: input.keyHint,
      status: "CONNECTED",
      lastError: null,
    },
  });
}

export async function markConnectionSynced(input: {
  orgId: string;
  provider: Provider;
  memberCount: number;
  cycleStart: Date;
  syncedAt: Date;
}): Promise<void> {
  await prisma.connection.update({
    where: { orgId_provider: { orgId: input.orgId, provider: input.provider } },
    data: {
      status: "CONNECTED",
      lastError: null,
      memberCount: input.memberCount,
      cycleStart: input.cycleStart,
      lastSyncedAt: input.syncedAt,
    },
  });
}

export async function listConnectedOrgIds(provider: Provider): Promise<string[]> {
  const rows = await prisma.connection.findMany({
    where: { provider, status: "CONNECTED" },
    select: { orgId: true },
  });
  return rows.map((row) => row.orgId);
}

export async function markConnectionError(
  orgId: string,
  provider: Provider,
  message: string,
): Promise<void> {
  await prisma.connection.update({
    where: { orgId_provider: { orgId, provider } },
    data: { status: "ERROR", lastError: message },
  });
}

export async function deleteConnection(orgId: string, provider: Provider): Promise<void> {
  await prisma.connection.deleteMany({ where: { orgId, provider } });
}
