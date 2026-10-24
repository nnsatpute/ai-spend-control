import { z } from "zod";

export const adminKeySchema = z
  .string({ error: "Admin API key is required" })
  .trim()
  .min(16, "That doesn't look like a full admin API key")
  .max(512, "That doesn't look like an admin API key")
  .regex(/^\S+$/, "Admin API key must not contain spaces");

/** Last 4 characters, so admins can tell keys apart without seeing them. */
export function keyHint(key: string): string {
  return `…${key.trim().slice(-4)}`;
}
