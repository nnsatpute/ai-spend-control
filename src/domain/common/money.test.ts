import { describe, expect, it } from "vitest";
import { dollarsToCents, formatUsdFromCents, sumDecimals } from "./money";

describe("money", () => {
  it("sums fractional cents without float drift", () => {
    expect(sumDecimals(["0.1", "0.2"]).toString()).toBe("0.3");
    expect(sumDecimals([2450.125487, "1875.500123"]).toString()).toBe("4325.62561");
  });

  it("converts dollars to cents", () => {
    expect(dollarsToCents(100).toString()).toBe("10000");
  });

  it("formats cents as USD", () => {
    expect(formatUsdFromCents("2450.125487")).toBe("$24.50");
    expect(formatUsdFromCents("123456789")).toBe("$1,234,567.89");
    expect(formatUsdFromCents(0)).toBe("$0.00");
    expect(formatUsdFromCents("0.5")).toBe("$0.01");
  });
});
