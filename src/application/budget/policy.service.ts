import { z } from "zod";
import { AppError } from "@/domain/common";
import { dollarsToCents, formatUsdFromCents } from "@/domain/common/money";
import {
  budgetPercent,
  capDollars,
  newCrossings,
  projectedBreachDate,
  reachedLevel,
  shouldApplyCap,
  type BudgetMode,
  type CapAction,
  type Threshold,
} from "@/domain/budget";
import { canManageBudgets } from "@/domain/organization";
import { decryptSecret, encryptSecret } from "@/infrastructure/crypto/secret-box";
import { appBaseUrl, sendEmail } from "@/infrastructure/email/resend";
import { setCursorSpendLimit } from "@/infrastructure/providers/cursor/client";
import { writeAuditLog } from "@/infrastructure/repositories/audit.repository";
import {
  findOwnerEmail,
  findPersonInOrg,
  findPolicy,
  listAlertLevels,
  listManagerEmails,
  listPersonBudgetAmounts,
  recordAlert,
  setPersonManagerEmail,
  upsertPersonBudget,
  upsertPolicy,
  type PolicyRecord,
} from "@/infrastructure/repositories/budget.repository";
import { findConnectionSummary, findEncryptedKey } from "@/infrastructure/repositories/connection.repository";
import { listSpendForCycle } from "@/infrastructure/repositories/spend.repository";
import { postSlack } from "@/infrastructure/slack/webhook";
import { formatDate } from "@/lib/format";
import type { OrgContext } from "@/lib/org";

const dollarsSchema = z.coerce
  .number()
  .int("Use a whole dollar amount")
  .positive("Amount must be at least $1")
  .max(100_000, "Amount is too large");

const modeSchema = z.enum(["MONITOR", "ENFORCE"]);
const actionSchema = z.enum(["ALERT", "CAP"]);

const managerEmailSchema = z
  .string()
  .trim()
  .email("Manager email is not valid")
  .max(256)
  .transform((value) => value.toLowerCase())
  .or(z.literal(""));

export type PolicyView = {
  defaultAmountCents: string;
  mode: BudgetMode;
  actionAt100: CapAction;
  slackConfigured: boolean;
};

export type BudgetPersonRow = {
  personId: string;
  email: string;
  name: string | null;
  spendCents: string;
  budgetCents: string | null;
  hasOwnBudget: boolean;
  managerEmail: string;
  percent: number | null;
  level: Threshold | null;
  projectedLabel: string | null;
};

export type BudgetBoard = {
  policy: PolicyView | null;
  rows: BudgetPersonRow[];
  cycleStart: Date | null;
};

function toView(policy: PolicyRecord): PolicyView {
  return {
    defaultAmountCents: policy.defaultAmountCents,
    mode: policy.mode,
    actionAt100: policy.actionAt100,
    slackConfigured: Boolean(policy.slackWebhookEnc),
  };
}

function resolvedBudget(
  personId: string,
  policy: PolicyRecord | null,
  own: Map<string, string>,
): { cents: string | null; own: boolean } {
  const override = own.get(personId);
  if (override) {
    return { cents: override, own: true };
  }
  return { cents: policy?.defaultAmountCents ?? null, own: false };
}

export async function getBudgetBoard(orgId: string): Promise<BudgetBoard> {
  const [policy, connection, ownRows] = await Promise.all([
    findPolicy(orgId),
    findConnectionSummary(orgId, "CURSOR"),
    listPersonBudgetAmounts(orgId),
  ]);
  const own = new Map(ownRows.map((row) => [row.personId, row.amountCents]));
  const cycleStart = connection?.cycleStart ?? null;
  const spend = cycleStart ? await listSpendForCycle(orgId, "CURSOR", cycleStart) : [];
  const now = new Date();

  const rows: BudgetPersonRow[] = spend.map((row) => {
    const budget = resolvedBudget(row.personId, policy, own);
    const breach = cycleStart
      ? projectedBreachDate({
          cycleStart,
          now,
          spendCents: row.spendCents,
          budgetCents: budget.cents,
        })
      : null;
    return {
      personId: row.personId,
      email: row.email,
      name: row.name,
      spendCents: row.spendCents,
      budgetCents: budget.cents,
      hasOwnBudget: budget.own,
      managerEmail: "",
      percent: budgetPercent(row.spendCents, budget.cents),
      level: reachedLevel(row.spendCents, budget.cents),
      projectedLabel: formatDate(breach),
    };
  });

  const people = await listManagerEmails(rows.map((row) => row.personId));
  for (const row of rows) {
    row.managerEmail = people.get(row.personId) ?? "";
  }

  return { policy: policy ? toView(policy) : null, rows, cycleStart };
}

export async function savePolicy(
  ctx: OrgContext,
  input: {
    amountDollars: unknown;
    mode: unknown;
    actionAt100: unknown;
    slackWebhook?: unknown;
  },
): Promise<void> {
  if (!canManageBudgets(ctx.role)) {
    throw new AppError("FORBIDDEN", "You don't have permission to change budgets");
  }
  const amount = dollarsSchema.safeParse(input.amountDollars);
  const mode = modeSchema.safeParse(input.mode);
  const action = actionSchema.safeParse(input.actionAt100);
  if (!amount.success || !mode.success || !action.success) {
    throw new AppError(
      "VALIDATION",
      amount.error?.issues[0]?.message ??
        mode.error?.issues[0]?.message ??
        action.error?.issues[0]?.message ??
        "Check the budget settings",
    );
  }

  let slackWebhookEnc: string | null | undefined;
  if (input.slackWebhook !== undefined) {
    const raw = typeof input.slackWebhook === "string" ? input.slackWebhook.trim() : "";
    if (raw === "") {
      slackWebhookEnc = null;
    } else if (!z.string().url().safeParse(raw).success || !raw.startsWith("https://")) {
      throw new AppError("VALIDATION", "Slack webhook must be an https URL");
    } else {
      slackWebhookEnc = encryptSecret(raw);
    }
  }

  const orgId = ctx.organization.id;
  await upsertPolicy({
    orgId,
    defaultAmountCents: dollarsToCents(amount.data).toString(),
    mode: mode.data,
    actionAt100: action.data,
    slackWebhookEnc,
  });
  await writeAuditLog({
    orgId,
    actorId: ctx.userId,
    action: "budget.policy_saved",
    detail: `Default $${amount.data}, ${mode.data}, at 100% ${action.data}`,
  });
}

export async function savePersonBudget(
  ctx: OrgContext,
  input: { personId: unknown; amountDollars: unknown; managerEmail?: unknown },
): Promise<void> {
  if (!canManageBudgets(ctx.role)) {
    throw new AppError("FORBIDDEN", "You don't have permission to change budgets");
  }
  if (typeof input.personId !== "string") {
    throw new AppError("VALIDATION", "Missing person");
  }
  const amount = dollarsSchema.safeParse(input.amountDollars);
  if (!amount.success) {
    throw new AppError("VALIDATION", amount.error.issues[0]?.message ?? "Enter a dollar amount");
  }
  const manager = managerEmailSchema.safeParse(input.managerEmail ?? "");
  if (!manager.success) {
    throw new AppError("VALIDATION", manager.error.issues[0]?.message ?? "Manager email is not valid");
  }

  const orgId = ctx.organization.id;
  const person = await findPersonInOrg(orgId, input.personId);
  if (!person) {
    throw new AppError("NOT_FOUND", "That person is not in this organization");
  }

  const amountCents = dollarsToCents(amount.data).toString();
  await upsertPersonBudget({ orgId, personId: person.id, amountCents });
  await setPersonManagerEmail(person.id, manager.data || null);

  const policy = await findPolicy(orgId);
  if (policy && shouldApplyCap(policy.mode, policy.actionAt100, 100)) {
    await applyCap(orgId, person.email, amountCents);
  }

  await writeAuditLog({
    orgId,
    actorId: ctx.userId,
    action: "budget.person_raised",
    detail: `${person.email} set to $${amount.data}`,
  });
}

async function applyCap(orgId: string, email: string, budgetCents: string): Promise<void> {
  const encrypted = await findEncryptedKey(orgId, "CURSOR");
  if (!encrypted) {
    return;
  }
  const connection = await findConnectionSummary(orgId, "CURSOR");
  const spend = connection?.cycleStart
    ? (await listSpendForCycle(orgId, "CURSOR", connection.cycleStart)).find((row) => row.email === email)
    : undefined;
  const dollars = capDollars(spend?.spendCents ?? "0", budgetCents);
  try {
    await setCursorSpendLimit(decryptSecret(encrypted), email, dollars);
  } catch (error) {
    if (error instanceof AppError) {
      throw new AppError(error.code, `Budget saved, but Cursor did not apply the cap. ${error.message}`);
    }
    throw error;
  }
}

/** Runs after a successful Cursor sync. Alerts once per threshold per cycle. */
export async function applyBudgets(input: {
  orgId: string;
  apiKey: string;
  cycleStart: Date;
}): Promise<void> {
  const policy = await findPolicy(input.orgId);
  if (!policy) {
    return;
  }

  const [spend, ownRows, sent, ownerEmail] = await Promise.all([
    listSpendForCycle(input.orgId, "CURSOR", input.cycleStart),
    listPersonBudgetAmounts(input.orgId),
    listAlertLevels(input.orgId, input.cycleStart),
    findOwnerEmail(input.orgId),
  ]);
  const own = new Map(ownRows.map((row) => [row.personId, row.amountCents]));
  const already = new Map<string, number[]>();
  for (const alert of sent) {
    const levels = already.get(alert.personId) ?? [];
    levels.push(alert.level);
    already.set(alert.personId, levels);
  }

  const managers = await listManagerEmails(spend.map((row) => row.personId));
  const webhook = policy.slackWebhookEnc ? decryptSecret(policy.slackWebhookEnc) : null;
  const budgetsUrl = `${appBaseUrl()}/budgets`;

  for (const row of spend) {
    const budgetCents = resolvedBudget(row.personId, policy, own).cents;
    const crossings = newCrossings(row.spendCents, budgetCents, already.get(row.personId) ?? []);
    for (const level of crossings) {
      const recorded = await recordAlert({
        orgId: input.orgId,
        personId: row.personId,
        cycleStart: input.cycleStart,
        level,
      });
      if (!recorded || budgetCents === null) {
        continue;
      }
      await notifyCrossing({
        orgId: input.orgId,
        apiKey: input.apiKey,
        policy,
        email: row.email,
        name: row.name ?? row.email,
        spendCents: row.spendCents,
        budgetCents,
        level,
        managerEmail: managers.get(row.personId) || ownerEmail,
        webhook,
        budgetsUrl,
        cycleStart: input.cycleStart,
      });
    }
  }
}

async function notifyCrossing(input: {
  orgId: string;
  apiKey: string;
  policy: PolicyRecord;
  email: string;
  name: string;
  spendCents: string;
  budgetCents: string;
  level: Threshold;
  managerEmail: string | null;
  webhook: string | null;
  budgetsUrl: string;
  cycleStart: Date;
}): Promise<void> {
  const spent = formatUsdFromCents(input.spendCents);
  const budget = formatUsdFromCents(input.budgetCents);
  const breach = projectedBreachDate({
    cycleStart: input.cycleStart,
    now: new Date(),
    spendCents: input.spendCents,
    budgetCents: input.budgetCents,
  });
  const when = formatDate(breach);
  const pace = when ? ` At this pace the budget is reached on ${when}.` : "";

  let capNote = "";
  if (input.level === 100 && shouldApplyCap(input.policy.mode, input.policy.actionAt100, 100)) {
    const dollars = capDollars(input.spendCents, input.budgetCents);
    try {
      await setCursorSpendLimit(input.apiKey, input.email, dollars);
      capNote = ` Cursor on-demand spend is now capped at $${dollars}.`;
      await writeAuditLog({
        orgId: input.orgId,
        actorId: null,
        action: "budget.capped",
        detail: `${input.email} capped at $${dollars}`,
      });
    } catch (error) {
      console.error("[budget] cap failed", input.email, error);
      capNote = " Cursor did not accept the cap; try Sync now or raise the budget.";
    }
  } else if (input.level === 100 && input.policy.mode === "MONITOR") {
    const dollars = capDollars(input.spendCents, input.budgetCents);
    capNote = ` Monitor mode: a live policy would cap Cursor at $${dollars}. Nothing was changed.`;
  }

  const personText =
    input.level === 80
      ? `You've used ${spent} of your ${budget} Cursor budget this cycle.${pace}`
      : `${input.name} has used ${spent} of a ${budget} Cursor budget (${input.level}%).${pace}${capNote} Raise it at ${input.budgetsUrl}`;

  const recipients =
    input.level === 80
      ? [input.email]
      : [input.managerEmail, input.level === 100 ? input.email : null].filter((value): value is string => Boolean(value));

  for (const to of new Set(recipients)) {
    try {
      await sendEmail({
        to,
        subject:
          input.level === 80
            ? "You've used 80% of your AI budget"
            : `${input.name} is at ${input.level}% of their AI budget`,
        text: personText,
        html: `<p>${personText}</p>`,
      });
    } catch (error) {
      console.error("[budget] email failed", to, error);
    }
  }

  if (input.webhook) {
    await postSlack(
      input.webhook,
      `${input.name} (${input.email}) is at ${input.level}% of their Cursor budget (${spent} of ${budget}).${capNote} ${input.budgetsUrl}`,
    );
  }
}
