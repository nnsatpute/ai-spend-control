import { describe, expect, it } from "vitest";
import {
  budgetPercent,
  capDollars,
  newCrossings,
  projectedBreachDate,
  reachedLevel,
  shouldApplyCap,
} from "./evaluate";

describe("budget thresholds", () => {
  it("stays quiet under 80%", () => {
    expect(reachedLevel("7900", "10000")).toBeNull();
    expect(newCrossings("7900", "10000", [])).toEqual([]);
  });

  it("reports each new crossing once, including ones skipped by a jump", () => {
    expect(newCrossings("9500", "10000", [])).toEqual([80, 90]);
    expect(newCrossings("9500", "10000", [80])).toEqual([90]);
    expect(newCrossings("12000", "10000", [80, 90, 100])).toEqual([]);
  });

  it("ignores a missing budget", () => {
    expect(budgetPercent("5000", null)).toBeNull();
    expect(reachedLevel("5000", "0")).toBeNull();
  });
});

describe("capDollars", () => {
  it("caps at the budget while spend is under it", () => {
    expect(capDollars("4000", "10000")).toBe(100);
  });

  it("never sets a cap below spend already incurred", () => {
    expect(capDollars("12040", "10000")).toBe(121);
  });

  it("rounds fractional dollars up", () => {
    expect(capDollars("1050", "2000")).toBe(20);
  });
});

describe("shouldApplyCap", () => {
  it("caps only in enforce mode at 100%", () => {
    expect(shouldApplyCap("ENFORCE", "CAP", 100)).toBe(true);
    expect(shouldApplyCap("MONITOR", "CAP", 100)).toBe(false);
    expect(shouldApplyCap("ENFORCE", "ALERT", 100)).toBe(false);
    expect(shouldApplyCap("ENFORCE", "CAP", 90)).toBe(false);
  });
});

describe("projectedBreachDate", () => {
  it("projects from the pace so far", () => {
    const cycleStart = new Date("2026-10-01T00:00:00Z");
    const now = new Date("2026-10-11T00:00:00Z");
    const breach = projectedBreachDate({
      cycleStart,
      now,
      spendCents: "5000",
      budgetCents: "10000",
    });
    expect(breach?.toISOString()).toBe("2026-10-21T00:00:00.000Z");
  });

  it("returns null with no spend", () => {
    expect(
      projectedBreachDate({
        cycleStart: new Date(),
        now: new Date(),
        spendCents: "0",
        budgetCents: "10000",
      }),
    ).toBeNull();
  });
});
