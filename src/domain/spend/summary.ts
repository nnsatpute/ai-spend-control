import { sumDecimals, toDecimal } from "@/domain/common/money";
import type { PersonSpendRow, SpendSummary } from "./types";

/** Highest on-demand spend first; ties broken by email for a stable order. */
export function sortBySpendDesc(rows: PersonSpendRow[]): PersonSpendRow[] {
  return [...rows].sort((a, b) => {
    const diff = toDecimal(b.spendCents).comparedTo(toDecimal(a.spendCents));
    return diff !== 0 ? diff : a.email.localeCompare(b.email);
  });
}

/** At or above a positive provider cap. A zero or missing cap means uncapped. */
export function isAtLimit(row: Pick<PersonSpendRow, "spendCents" | "effectiveLimitCents">): boolean {
  if (row.effectiveLimitCents === null) {
    return false;
  }
  const limit = toDecimal(row.effectiveLimitCents);
  return limit.greaterThan(0) && toDecimal(row.spendCents).greaterThanOrEqualTo(limit);
}

export function summarizeSpend(rows: PersonSpendRow[]): SpendSummary {
  const total = sumDecimals(rows.map((r) => r.spendCents));
  const totalOverall = sumDecimals(rows.map((r) => r.overallSpendCents));
  const sorted = sortBySpendDesc(rows);
  const top3 = sumDecimals(sorted.slice(0, 3).map((r) => r.spendCents));

  return {
    peopleCount: rows.length,
    totalSpendCents: total.toString(),
    totalOverallSpendCents: totalOverall.toString(),
    spendingPeopleCount: rows.filter((r) => toDecimal(r.spendCents).greaterThan(0)).length,
    top3Share: total.isZero()
      ? null
      : top3.dividedBy(total).toDecimalPlaces(4).toNumber(),
    atLimitCount: rows.filter(isAtLimit).length,
  };
}
