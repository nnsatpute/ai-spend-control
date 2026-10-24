import { describe, expect, it } from "vitest";
import { adminKeySchema, keyHint } from "./schemas";

describe("adminKeySchema", () => {
  it("accepts and trims a plausible key", () => {
    const parsed = adminKeySchema.safeParse("  crsr_0123456789abcdef  ");
    expect(parsed.success).toBe(true);
    expect(parsed.data).toBe("crsr_0123456789abcdef");
  });

  it("rejects short keys and keys with spaces", () => {
    expect(adminKeySchema.safeParse("short").success).toBe(false);
    expect(adminKeySchema.safeParse("key_0123 456789abcdef").success).toBe(false);
    expect(adminKeySchema.safeParse(undefined).success).toBe(false);
  });
});

describe("keyHint", () => {
  it("shows only the last 4 characters", () => {
    expect(keyHint("key_0123456789abcdef")).toBe("…cdef");
  });
});
