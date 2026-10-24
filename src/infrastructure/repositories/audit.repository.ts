import { prisma } from "@/infrastructure/db";

export async function listAuditLogs(orgId: string, limit = 100) {
  return prisma.auditLog.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, action: true, detail: true, createdAt: true, actorId: true },
  });
}

export async function writeAuditLog(input: {
  orgId: string;
  actorId: string | null;
  action: string;
  detail?: string;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      orgId: input.orgId,
      actorId: input.actorId,
      action: input.action,
      detail: input.detail ?? null,
    },
  });
}
