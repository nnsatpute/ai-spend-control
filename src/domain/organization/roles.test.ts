import { describe, expect, it } from "vitest";
import { canManageBudgets, canManageConnections, canSyncConnections } from "./roles";

describe("canManageConnections", () => {
  it("allows owners and admins only", () => {
    expect(canManageConnections("OWNER")).toBe(true);
    expect(canManageConnections("ADMIN")).toBe(true);
    expect(canManageConnections("MANAGER")).toBe(false);
    expect(canManageConnections("VIEWER")).toBe(false);
    expect(canManageConnections(null)).toBe(false);
  });
});

describe("canManageBudgets", () => {
  it("allows managers and above", () => {
    expect(canManageBudgets("MANAGER")).toBe(true);
    expect(canManageBudgets("VIEWER")).toBe(false);
  });
});

describe("canSyncConnections", () => {
  it("allows managers but not viewers", () => {
    expect(canSyncConnections("MANAGER")).toBe(true);
    expect(canSyncConnections("VIEWER")).toBe(false);
    expect(canSyncConnections(undefined)).toBe(false);
  });
});
