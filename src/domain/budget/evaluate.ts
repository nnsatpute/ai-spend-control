import { Decimal } from "@prisma/client/runtime/library";
import { toDecimal } from "@/domain/common/money";

export const THRESHOLDS = [80, 90, 100] as const;
export type Threshold = (typeof THRESHOLDS)[number];

export type BudgetMode = "MONITOR" | "ENFORCE";
export type CapAction = "ALERT" | "CAP";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Share of the budget used, or null when there is no positive budget. */
export function budgetPercent(spendCents: string, budgetCents: string | null): number | null {
  if (budgetCents === null) {
    return null;
  }
  const budget = toDecimal(budgetCents);
  if (budget.lessThanOrEqualTo(0)) {
    return null;
  }
  return toDecimal(spendCents).dividedBy(budget).times(100).toDecimalPlaces(1).toNumber();
}

/** Highest threshold reached, or null when spend is under 80%. */
export function reachedLevel(spendCents: string, budgetCents: string | null): Threshold | null {
  const percent = budgetPercent(spendCents, budgetCents);
  if (percent === null) {
    return null;
  }
  if (percent >= 100) return 100;
  if (percent >= 90) return 90;
  if (percent >= 80) return 80;
  return null;
}

/** Thresholds crossed now that have not already been alerted. Highest last. */
export function newCrossings(spendCents: string, budgetCents: string | null, already: number[]): Threshold[] {
  const level = reachedLevel(spendCents, budgetCents);
  if (level === null) {
    return [];
  }
  return THRESHOLDS.filter((threshold) => threshold <= level && !already.includes(threshold));
}

/**
 * Integer dollar cap for Cursor. Never below what the person has already spent,
 * so a late sync cannot set a limit under current spend.
 */
export function capDollars(spendCents: string, budgetCents: string): number {
  const spent = toDecimal(spendCents).dividedBy(100).toDecimalPlaces(0, Decimal.ROUND_CEIL);
  const budget = toDecimal(budgetCents).dividedBy(100).toDecimalPlaces(0, Decimal.ROUND_CEIL);
  const cap = spent.greaterThan(budget) ? spent : budget;
  return cap.toNumber();
}

export function shouldApplyCap(mode: BudgetMode, action: CapAction, level: Threshold): boolean {
  return mode === "ENFORCE" && action === "CAP" && level === 100;
}

/**
 * When the person hits the budget if today's pace holds.
 * Null when there is no spend yet or no budget.
 */
export function projectedBreachDate(input: {
  cycleStart: Date;
  now: Date;
  spendCents: string;
  budgetCents: string | null;
}): Date | null {
  const { cycleStart, now, spendCents, budgetCents } = input;
  if (budgetCents === null || toDecimal(budgetCents).lessThanOrEqualTo(0)) {
    return null;
  }
  const spent = toDecimal(spendCents);
  if (spent.lessThanOrEqualTo(0)) {
    return null;
  }

  const elapsedMs = Math.max(now.getTime() - cycleStart.getTime(), DAY_MS);
  const daysElapsed = elapsedMs / DAY_MS;
  const daysNeeded = toDecimal(budgetCents).dividedBy(spent).times(daysElapsed);
  return new Date(cycleStart.getTime() + daysNeeded.times(DAY_MS).toNumber());
}
