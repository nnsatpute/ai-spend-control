import { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db";

export async function upsertDailyUsage(input: {
  orgId: string;
  personId: string;
  day: Date;
  usageBasedReqs: number;
  agentRequests: number;
  mostUsedModel: string | null;
}): Promise<void> {
  await prisma.dailyUsage.upsert({
    where: {
      orgId_personId_day: { orgId: input.orgId, personId: input.personId, day: input.day },
    },
    create: input,
    update: {
      usageBasedReqs: input.usageBasedReqs,
      agentRequests: input.agentRequests,
      mostUsedModel: input.mostUsedModel,
    },
  });
}

export async function listRecentUsage(
  orgId: string,
  since: Date,
): Promise<
  {
    personId: string;
    email: string;
    name: string | null;
    managerEmail: string | null;
    day: Date;
    usageBasedReqs: number;
  }[]
> {
  const rows = await prisma.dailyUsage.findMany({
    where: { orgId, day: { gte: since } },
    orderBy: { day: "asc" },
    select: {
      personId: true,
      day: true,
      usageBasedReqs: true,
      person: { select: { email: true, name: true, managerEmail: true } },
    },
  });
  return rows.map((row) => ({
    personId: row.personId,
    email: row.person.email,
    name: row.person.name,
    managerEmail: row.person.managerEmail,
    day: row.day,
    usageBasedReqs: row.usageBasedReqs,
  }));
}

/** Returns false when this person/day was already flagged. */
export async function recordAnomaly(input: {
  orgId: string;
  personId: string;
  day: Date;
  rule: string;
  value: number;
  baseline: string;
}): Promise<boolean> {
  try {
    await prisma.anomalyEvent.create({ data: input });
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return false;
    }
    throw error;
  }
}

export async function usageTrend(
  orgId: string,
  since: Date,
): Promise<{ day: string; requests: number }[]> {
  const rows = await prisma.dailyUsage.groupBy({
    by: ["day"],
    where: { orgId, day: { gte: since } },
    _sum: { usageBasedReqs: true },
    orderBy: { day: "asc" },
  });
  return rows.map((row) => ({
    day: row.day.toISOString().slice(0, 10),
    requests: row._sum.usageBasedReqs ?? 0,
  }));
}

export async function setManagerByEmail(
  orgId: string,
  email: string,
  managerEmail: string,
): Promise<boolean> {
  const result = await prisma.person.updateMany({
    where: { orgId, email },
    data: { managerEmail },
  });
  return result.count > 0;
}

export async function listPeopleByEmail(orgId: string): Promise<Map<string, string>> {
  const people = await prisma.person.findMany({
    where: { orgId },
    select: { id: true, email: true },
  });
  return new Map(people.map((person) => [person.email.toLowerCase(), person.id]));
}
