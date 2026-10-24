import { z } from "zod";
import { dollarsToCents, toDecimal } from "@/domain/common/money";
import type { ProviderMemberSpend } from "@/domain/spend";

/** Shape of POST https://api.cursor.com/teams/spend (fields we use). */
const memberSpendSchema = z.object({
  userId: z.string().nullish(),
  email: z.string().min(1),
  name: z.string().nullish(),
  role: z.string().nullish(),
  spendCents: z.number().nullish(),
  overallSpendCents: z.number().nullish(),
  fastPremiumRequests: z.number().nullish(),
  effectivePerUserLimitDollars: z.number().nullish(),
});

export const cursorSpendPageSchema = z.object({
  teamMemberSpend: z.array(memberSpendSchema),
  subscriptionCycleStart: z.number(),
  totalMembers: z.number().nullish(),
  totalPages: z.number().nullish(),
});

export type CursorSpendPage = z.infer<typeof cursorSpendPageSchema>;

export function toMemberSpend(
  member: CursorSpendPage["teamMemberSpend"][number],
): ProviderMemberSpend {
  const limitDollars = member.effectivePerUserLimitDollars;
  return {
    providerUserId: member.userId ?? null,
    email: member.email.trim().toLowerCase(),
    name: member.name?.trim() || null,
    role: member.role ?? null,
    spendCents: toDecimal(member.spendCents ?? 0).toString(),
    overallSpendCents: toDecimal(member.overallSpendCents ?? member.spendCents ?? 0).toString(),
    premiumRequests: Math.max(0, Math.trunc(member.fastPremiumRequests ?? 0)),
    effectiveLimitCents:
      limitDollars && limitDollars > 0 ? dollarsToCents(limitDollars).toString() : null,
  };
}
