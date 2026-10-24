import { describe, expect, it } from "vitest";
import { sortBySpendDesc, summarizeSpend } from "./summary";
import type { PersonSpendRow } from "./types";

function row(email: string, spendCents: string, limit: string | null = null): PersonSpendRow {
  return {
    personId: email,
    email,
    name: null,
    spendCents,
    overallSpendCents: spendCents,
    premiumRequests: 0,
    effectiveLimitCents: limit,
  };
}

describe("summarizeSpend", () => {
  it("handles an empty team", () => {
    const summary = summarizeSpend([]);
    expect(summary.peopleCount).toBe(0);
    expect(summary.totalSpendCents).toBe("0");
    expect(summary.top3Share).toBeNull();
  });

  it("totals fractional cents and computes top-3 share", () => {
    const summary = summarizeSpend([
      row("a@x.com", "6000.5"),
      row("b@x.com", "2000"),
      row("c@x.com", "1000"),
      row("d@x.com", "999.5"),
      row("e@x.com", "0"),
    ]);
    expect(summary.totalSpendCents).toBe("10000");
    expect(summary.spendingPeopleCount).toBe(4);
    expect(summary.top3Share).toBe(0.9001);
  });

  it("counts people at or above their cap, ignoring zero caps", () => {
    const summary = summarizeSpend([
      row("a@x.com", "10000", "10000"),
      row("b@x.com", "5000", "10000"),
      row("c@x.com", "5000", "0"),
      row("d@x.com", "5000", null),
    ]);
    expect(summary.atLimitCount).toBe(1);
  });
});

describe("sortBySpendDesc", () => {
  it("orders by spend then email", () => {
    const sorted = sortBySpendDesc([
      row("b@x.com", "10"),
      row("a@x.com", "10"),
      row("c@x.com", "99"),
    ]);
    expect(sorted.map((r) => r.email)).toEqual(["c@x.com", "a@x.com", "b@x.com"]);
  });
});
