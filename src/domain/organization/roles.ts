import type { MemberRole } from "./types";

/** Only owners and admins may hand us (or remove) provider admin keys. */
export function canManageConnections(role: MemberRole | null | undefined): boolean {
  return role === "OWNER" || role === "ADMIN";
}

/** Anyone in the org can trigger a refresh of data they can already see. */
export function canSyncConnections(role: MemberRole | null | undefined): boolean {
  return role === "OWNER" || role === "ADMIN" || role === "MANAGER";
}

/** Owners, admins, and managers set budgets and raise caps. */
export function canManageBudgets(role: MemberRole | null | undefined): boolean {
  return role === "OWNER" || role === "ADMIN" || role === "MANAGER";
}
