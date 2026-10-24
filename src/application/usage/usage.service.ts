import { usageSpike } from "@/domain/usage";
import { sendEmail, appBaseUrl } from "@/infrastructure/email/resend";
import { fetchCursorDailyUsage } from "@/infrastructure/providers/cursor/client";
import { findOwnerEmail } from "@/infrastructure/repositories/budget.repository";
import { writeAuditLog } from "@/infrastructure/repositories/audit.repository";
import {
  listPeopleByEmail,
  listRecentUsage,
  recordAnomaly,
  upsertDailyUsage,
  usageTrend,
} from "@/infrastructure/repositories/usage.repository";

export async function getUsageTrend(orgId: string) {
  return usageTrend(orgId, daysAgo(13));
}

const HISTORY_DAYS = 14;
const SPIKE_RULE = "usage_2x";

function utcDate(isoDay: string): Date {
  return new Date(`${isoDay}T00:00:00.000Z`);
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

/**
 * Stores the last 14 days of usage-based requests and emails once when the newest day
 * is at least twice that person's recent average. Failures must not fail the spend sync.
 */
export async function syncDailyUsage(orgId: string, apiKey: string): Promise<void> {
  const rows = await fetchCursorDailyUsage(apiKey, HISTORY_DAYS);
  const people = await listPeopleByEmail(orgId);

  for (const row of rows) {
    const personId = people.get(row.email);
    if (!personId) {
      continue;
    }
    await upsertDailyUsage({
      orgId,
      personId,
      day: utcDate(row.day),
      usageBasedReqs: row.usageBasedReqs,
      agentRequests: row.agentRequests,
      mostUsedModel: row.mostUsedModel,
    });
  }

  await flagSpikes(orgId);
}

async function flagSpikes(orgId: string): Promise<void> {
  const recent = await listRecentUsage(orgId, daysAgo(HISTORY_DAYS));
  const byPerson = new Map<string, typeof recent>();
  for (const row of recent) {
    const list = byPerson.get(row.personId) ?? [];
    list.push(row);
    byPerson.set(row.personId, list);
  }

  const ownerEmail = await findOwnerEmail(orgId);

  for (const [personId, days] of byPerson) {
    const latest = days[days.length - 1];
    if (!latest) {
      continue;
    }
    const prior = days.slice(0, -1).slice(-7).map((day) => day.usageBasedReqs);
    const spike = usageSpike(latest.usageBasedReqs, prior);
    if (!spike) {
      continue;
    }

    const recorded = await recordAnomaly({
      orgId,
      personId,
      day: latest.day,
      rule: SPIKE_RULE,
      value: spike.value,
      baseline: spike.baseline.toFixed(4),
    });
    if (!recorded) {
      continue;
    }

    const to = latest.managerEmail ?? ownerEmail;
    if (!to) {
      continue;
    }

    const who = latest.name ?? latest.email;
    const baseline = spike.baseline.toFixed(1);
    await sendEmail({
      to,
      subject: `Usage spike: ${who}`,
      text: `${who} made ${spike.value} usage-based requests on ${latest.day.toISOString().slice(0, 10)}, about twice their recent daily average of ${baseline}. This is request activity, not a dollar amount. Review it at ${appBaseUrl()}/dashboard`,
      html: `<p><strong>${who}</strong> made ${spike.value} usage-based requests on ${latest.day.toISOString().slice(0, 10)}, about twice their recent daily average of ${baseline}.</p><p>This is request activity, not a dollar amount.</p><p><a href="${appBaseUrl()}/dashboard">Open spend</a></p>`,
    });
    await writeAuditLog({
      orgId,
      actorId: null,
      action: "usage.spike",
      detail: `${latest.email} ${spike.value} requests vs avg ${baseline}`,
    });
  }
}
