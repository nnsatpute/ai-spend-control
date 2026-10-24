import { prisma } from "@/infrastructure/db";
import type { Provider } from "@/domain/connection";
import type { PersonSpendRow, ProviderSpendReport } from "@/domain/spend";

/** Upserts people by email and their snapshot for the report's billing cycle. */
export async function saveSpendReport(input: {
  orgId: string;
  provider: Provider;
  report: ProviderSpendReport;
  syncedAt: Date;
}): Promise<void> {
  const { orgId, provider, report, syncedAt } = input;

  await prisma.$transaction(
    async (tx) => {
      for (const member of report.members) {
        const person = await tx.person.upsert({
          where: { orgId_email: { orgId, email: member.email } },
          create: {
            orgId,
            email: member.email,
            name: member.name,
            cursorUserId: provider === "CURSOR" ? member.providerUserId : null,
            cursorRole: provider === "CURSOR" ? member.role : null,
          },
          update: {
            ...(member.name ? { name: member.name } : {}),
            ...(provider === "CURSOR"
              ? { cursorUserId: member.providerUserId, cursorRole: member.role }
              : {}),
          },
          select: { id: true },
        });

        const values = {
          spendCents: member.spendCents,
          overallSpendCents: member.overallSpendCents,
          premiumRequests: member.premiumRequests,
          effectiveLimitCents: member.effectiveLimitCents,
          syncedAt,
        };

        await tx.spendSnapshot.upsert({
          where: {
            orgId_provider_personId_cycleStart: {
              orgId,
              provider,
              personId: person.id,
              cycleStart: report.cycleStart,
            },
          },
          create: { orgId, provider, personId: person.id, cycleStart: report.cycleStart, ...values },
          update: values,
        });
      }
    },
    { timeout: 60_000 },
  );
}

export async function listSpendForCycle(
  orgId: string,
  provider: Provider,
  cycleStart: Date,
): Promise<PersonSpendRow[]> {
  const rows = await prisma.spendSnapshot.findMany({
    where: { orgId, provider, cycleStart },
    include: { person: { select: { id: true, email: true, name: true } } },
  });

  return rows.map((row) => ({
    personId: row.person.id,
    email: row.person.email,
    name: row.person.name,
    spendCents: row.spendCents.toString(),
    overallSpendCents: row.overallSpendCents.toString(),
    premiumRequests: row.premiumRequests,
    effectiveLimitCents: row.effectiveLimitCents?.toString() ?? null,
  }));
}
