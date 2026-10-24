import { z } from "zod";

const dailyRowSchema = z.object({
  email: z.string().min(1),
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  usageBasedReqs: z.number().nullish(),
  agentRequests: z.number().nullish(),
  mostUsedModel: z.string().nullish(),
});

export const cursorDailyPageSchema = z.object({
  data: z.array(dailyRowSchema),
  pagination: z
    .object({
      hasNextPage: z.boolean().optional(),
      totalPages: z.number().optional(),
    })
    .optional(),
});

export type CursorDailyRow = {
  email: string;
  day: string;
  usageBasedReqs: number;
  agentRequests: number;
  mostUsedModel: string | null;
};

export function toDailyRow(row: z.infer<typeof dailyRowSchema>): CursorDailyRow {
  return {
    email: row.email.trim().toLowerCase(),
    day: row.day,
    usageBasedReqs: Math.max(0, Math.trunc(row.usageBasedReqs ?? 0)),
    agentRequests: Math.max(0, Math.trunc(row.agentRequests ?? 0)),
    mostUsedModel: row.mostUsedModel?.trim() || null,
  };
}
