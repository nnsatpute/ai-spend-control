import { describe, expect, it } from "vitest";
import { cursorSpendPageSchema, toMemberSpend } from "./parse";

// Sample from https://cursor.com/docs/account/teams/admin-api (POST /teams/spend)
const sample = {
  teamMemberSpend: [
    {
      userId: "user_PDSPmvukpYgZEDXsoNirw3CFhy",
      spendCents: 2450.125487,
      overallSpendCents: 2450.125487,
      fastPremiumRequests: 1250,
      name: "Alex",
      email: "Developer@Company.com",
      role: "member",
      hardLimitOverrideDollars: 100,
      monthlyLimitDollars: 200,
      effectivePerUserLimitDollars: 100,
    },
    {
      userId: "user_kljUvI0ASZORvSEXf9hV0ydcso",
      spendCents: 1875.500123,
      overallSpendCents: 3200.750456,
      fastPremiumRequests: 980,
      name: "Sam",
      email: "admin@company.com",
      role: "owner",
      hardLimitOverrideDollars: 0,
      monthlyLimitDollars: null,
      effectivePerUserLimitDollars: 0,
    },
  ],
  subscriptionCycleStart: 1708992000000,
  totalMembers: 15,
  totalPages: 1,
};

describe("cursor spend parsing", () => {
  it("parses the documented response", () => {
    const page = cursorSpendPageSchema.parse(sample);
    const [alex, sam] = page.teamMemberSpend.map(toMemberSpend);

    expect(alex).toEqual({
      providerUserId: "user_PDSPmvukpYgZEDXsoNirw3CFhy",
      email: "developer@company.com",
      name: "Alex",
      role: "member",
      spendCents: "2450.125487",
      overallSpendCents: "2450.125487",
      premiumRequests: 1250,
      effectiveLimitCents: "10000",
    });
    expect(sam?.effectiveLimitCents).toBeNull();
    expect(sam?.overallSpendCents).toBe("3200.750456");
  });

  it("rejects a response without the spend array", () => {
    expect(cursorSpendPageSchema.safeParse({ subscriptionCycleStart: 1 }).success).toBe(false);
  });

  it("defaults missing numbers to zero", () => {
    const member = toMemberSpend({ email: "x@y.com" });
    expect(member.spendCents).toBe("0");
    expect(member.overallSpendCents).toBe("0");
    expect(member.premiumRequests).toBe(0);
  });
});
