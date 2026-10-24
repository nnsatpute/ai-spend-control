import { Prisma } from "@prisma/client";
import { sendEmail, appBaseUrl } from "@/infrastructure/email/resend";
import { prisma } from "@/infrastructure/db";
import { findOwnerEmail, findPolicy } from "@/infrastructure/repositories/budget.repository";
import { findConnectionSummary, listConnectedOrgIds } from "@/infrastructure/repositories/connection.repository";
import { syncCursorForOrg } from "@/application/connection/connection.service";

export type SyncAllResult = {
  orgs: number;
  synced: number;
  failed: number;
  digests: number;
};

/** Hourly job: refresh every connected Cursor org, then send the Monday digest once. */
export async function syncAllConnectedOrgs(): Promise<SyncAllResult> {
  const orgIds = await listConnectedOrgIds("CURSOR");
  let synced = 0;
  let failed = 0;
  let digests = 0;

  for (const orgId of orgIds) {
    try {
      await syncCursorForOrg(orgId);
      synced += 1;
      if (await sendMondayDigest(orgId)) {
        digests += 1;
      }
    } catch (error) {
      failed += 1;
      console.error("[cron] org sync failed", orgId, error);
    }
  }

  return { orgs: orgIds.length, synced, failed, digests };
}

function utcMonday(now = new Date()): Date | null {
  if (now.getUTCDay() !== 1) {
    return null;
  }
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

async function claimDigest(orgId: string, weekStart: Date): Promise<boolean> {
  try {
    await prisma.digestLog.create({ data: { orgId, weekStart } });
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return false;
    }
    throw error;
  }
}

async function releaseDigest(orgId: string, weekStart: Date): Promise<void> {
  await prisma.digestLog.deleteMany({ where: { orgId, weekStart } });
}

async function sendMondayDigest(orgId: string): Promise<boolean> {
  const weekStart = utcMonday();
  if (!weekStart) {
    return false;
  }
  const owner = await findOwnerEmail(orgId);
  if (!owner) {
    return false;
  }
  const claimed = await claimDigest(orgId, weekStart);
  if (!claimed) {
    return false;
  }

  try {
    const body = await digestBody(orgId);
    await sendEmail({
      to: owner,
      subject: "Weekly AI spend digest",
      text: body.text,
      html: body.html,
    });
    return true;
  } catch (error) {
    console.error("[digest] send failed", orgId, error);
    await releaseDigest(orgId, weekStart);
    return false;
  }
}

async function digestBody(orgId: string): Promise<{ text: string; html: string }> {
  const [connection, policy] = await Promise.all([
    findConnectionSummary(orgId, "CURSOR"),
    findPolicy(orgId),
  ]);

  const alerts = connection?.cycleStart
    ? await prisma.budgetAlert.findMany({
        where: { orgId, cycleStart: connection.cycleStart },
        include: { person: { select: { email: true, name: true } } },
        orderBy: [{ level: "desc" }, { createdAt: "asc" }],
      })
    : [];

  const monitorOnly = !policy || policy.mode === "MONITOR" || policy.actionAt100 === "ALERT";
  const lines = alerts.map((alert) => {
    const who = alert.person.name ?? alert.person.email;
    const capNote = alert.level === 100 && monitorOnly ? " (would have been capped)" : "";
    return `${who} crossed ${alert.level}%${capNote}`;
  });

  const summary =
    lines.length === 0
      ? "Nobody crossed 80%, 90%, or 100% of their budget this cycle."
      : lines.join("\n");

  const link = `${appBaseUrl()}/budgets`;
  return {
    text: `${summary}\n\nOpen budgets: ${link}`,
    html: `<p>${lines.length === 0 ? summary : lines.map((line) => escapeHtml(line)).join("<br />")}</p><p><a href="${link}">Open budgets</a></p>`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
