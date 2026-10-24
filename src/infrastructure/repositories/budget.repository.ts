import { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db";
import type { BudgetMode, CapAction } from "@/domain/budget";

export type PolicyRecord = {
  defaultAmountCents: string;
  mode: BudgetMode;
  actionAt100: CapAction;
  slackWebhookEnc: string | null;
};

export async function findPolicy(orgId: string): Promise<PolicyRecord | null> {
  const row = await prisma.spendPolicy.findUnique({ where: { orgId } });
  if (!row) {
    return null;
  }
  return {
    defaultAmountCents: row.defaultAmountCents.toString(),
    mode: row.mode,
    actionAt100: row.actionAt100,
    slackWebhookEnc: row.slackWebhookEnc,
  };
}

export async function upsertPolicy(input: {
  orgId: string;
  defaultAmountCents: string;
  mode: BudgetMode;
  actionAt100: CapAction;
  slackWebhookEnc?: string | null;
}): Promise<void> {
  const shared = {
    defaultAmountCents: input.defaultAmountCents,
    mode: input.mode,
    actionAt100: input.actionAt100,
    ...(input.slackWebhookEnc !== undefined ? { slackWebhookEnc: input.slackWebhookEnc } : {}),
  };
  await prisma.spendPolicy.upsert({
    where: { orgId: input.orgId },
    create: { orgId: input.orgId, ...shared },
    update: shared,
  });
}

export async function listPersonBudgetAmounts(
  orgId: string,
): Promise<{ personId: string; amountCents: string }[]> {
  const rows = await prisma.personBudget.findMany({
    where: { orgId },
    select: { personId: true, amountCents: true },
  });
  return rows.map((row) => ({ personId: row.personId, amountCents: row.amountCents.toString() }));
}

export async function upsertPersonBudget(input: {
  orgId: string;
  personId: string;
  amountCents: string;
}): Promise<void> {
  await prisma.personBudget.upsert({
    where: { personId: input.personId },
    create: input,
    update: { amountCents: input.amountCents },
  });
}

export async function setPersonManagerEmail(
  personId: string,
  managerEmail: string | null,
): Promise<void> {
  await prisma.person.update({
    where: { id: personId },
    data: { managerEmail },
  });
}

export async function listManagerEmails(personIds: string[]): Promise<Map<string, string | null>> {
  if (personIds.length === 0) {
    return new Map();
  }
  const people = await prisma.person.findMany({
    where: { id: { in: personIds } },
    select: { id: true, managerEmail: true },
  });
  return new Map(people.map((person) => [person.id, person.managerEmail]));
}

export async function listAlertLevels(
  orgId: string,
  cycleStart: Date,
): Promise<{ personId: string; level: number }[]> {
  return prisma.budgetAlert.findMany({
    where: { orgId, cycleStart },
    select: { personId: true, level: true },
  });
}

/** Returns false when this threshold was already recorded for the cycle. */
export async function recordAlert(input: {
  orgId: string;
  personId: string;
  cycleStart: Date;
  level: number;
}): Promise<boolean> {
  try {
    await prisma.budgetAlert.create({ data: input });
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return false;
    }
    throw error;
  }
}

export async function findOwnerEmail(orgId: string): Promise<string | null> {
  const membership = await prisma.membership.findFirst({
    where: { orgId, role: "OWNER" },
    orderBy: { createdAt: "asc" },
    select: { user: { select: { email: true } } },
  });
  return membership?.user.email ?? null;
}

export async function findPersonInOrg(
  orgId: string,
  personId: string,
): Promise<{ id: string; email: string; name: string | null } | null> {
  return prisma.person.findFirst({
    where: { id: personId, orgId },
    select: { id: true, email: true, name: true },
  });
}
