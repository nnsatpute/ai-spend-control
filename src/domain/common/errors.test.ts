import { describe, expect, it } from "vitest";
import {
  isDatabaseUnavailable,
  rethrowSafe,
  SERVICE_UNAVAILABLE_MESSAGE,
} from "./errors";

describe("isDatabaseUnavailable", () => {
  it("detects Prisma init connection failures", () => {
    const error = Object.assign(new Error("Can't reach database server at localhost:5432"), {
      name: "PrismaClientInitializationError",
    });
    expect(isDatabaseUnavailable(error)).toBe(true);
  });

  it("ignores normal validation-like errors", () => {
    expect(isDatabaseUnavailable(new Error("Invalid email"))).toBe(false);
  });
});

describe("rethrowSafe", () => {
  it("maps DB failures to Service unavailable", () => {
    const error = Object.assign(new Error("Can't reach database server"), {
      name: "PrismaClientInitializationError",
    });

    expect(() => rethrowSafe(error)).toThrow(SERVICE_UNAVAILABLE_MESSAGE);
  });
});
