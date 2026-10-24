import { describe, expect, it } from "vitest";
import { parseManagerCsv } from "./manager-csv";

describe("parseManagerCsv", () => {
  it("parses a header and lowercases emails", () => {
    const result = parseManagerCsv("email,managerEmail\nPriya@Co.com, Boss@Co.com\n");
    expect(result.rows).toEqual([{ email: "priya@co.com", managerEmail: "boss@co.com" }]);
    expect(result.skipped).toBe(0);
  });

  it("skips rows that are not two emails", () => {
    const result = parseManagerCsv("a@x.com,not-an-email\nb@x.com,c@x.com");
    expect(result.rows).toHaveLength(1);
    expect(result.skipped).toBe(1);
  });
});
