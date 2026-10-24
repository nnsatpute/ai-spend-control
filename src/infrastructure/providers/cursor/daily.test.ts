import { describe, expect, it } from "vitest";
import { cursorDailyPageSchema, toDailyRow } from "./daily";

const sample = {
  data: [
    {
      email: "Developer@Company.com",
      day: "2024-03-18",
      usageBasedReqs: 5,
      agentRequests: 12,
      mostUsedModel: "gpt-5",
    },
  ],
  pagination: { page: 1, hasNextPage: false, totalPages: 1 },
};

describe("cursor daily usage parsing", () => {
  it("parses the documented row", () => {
    const page = cursorDailyPageSchema.parse(sample);
    expect(toDailyRow(page.data[0]!)).toEqual({
      email: "developer@company.com",
      day: "2024-03-18",
      usageBasedReqs: 5,
      agentRequests: 12,
      mostUsedModel: "gpt-5",
    });
  });

  it("defaults missing counts to zero", () => {
    expect(toDailyRow({ email: "a@b.com", day: "2024-01-01" })).toEqual({
      email: "a@b.com",
      day: "2024-01-01",
      usageBasedReqs: 0,
      agentRequests: 0,
      mostUsedModel: null,
    });
  });
});
