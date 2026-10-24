import { z } from "zod";

const emailSchema = z.string().trim().email().max(256).transform((value) => value.toLowerCase());

export type ManagerCsvRow = { email: string; managerEmail: string };

export type ManagerCsvResult = {
  rows: ManagerCsvRow[];
  skipped: number;
};

/** Parses `email,managerEmail`. A header row is optional. Blank lines are ignored. */
export function parseManagerCsv(text: string): ManagerCsvResult {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const rows: ManagerCsvRow[] = [];
  let skipped = 0;

  lines.forEach((line, index) => {
    const parts = line.split(",").map((part) => part.trim());
    const emailRaw = parts[0] ?? "";
    const managerRaw = parts[1] ?? "";
    if (index === 0 && emailRaw.toLowerCase() === "email") {
      return;
    }
    const email = emailSchema.safeParse(emailRaw);
    const manager = emailSchema.safeParse(managerRaw);
    if (!email.success || !manager.success) {
      skipped += 1;
      return;
    }
    rows.push({ email: email.data, managerEmail: manager.data });
  });

  return { rows, skipped };
}
