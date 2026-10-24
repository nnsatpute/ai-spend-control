import { AppError } from "@/domain/common";
import type { ProviderSpendReport } from "@/domain/spend";
import { cursorDailyPageSchema, toDailyRow, type CursorDailyRow } from "./daily";
import { cursorSpendPageSchema, toMemberSpend } from "./parse";

const BASE_URL = "https://api.cursor.com";
const PAGE_SIZE = 100;
/** Cursor allows ~20 admin requests/minute; stay well under it in one sync. */
const MAX_PAGES = 15;
const TIMEOUT_MS = 15_000;

async function postSpendPage(apiKey: string, page: number): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/teams/spend`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ page, pageSize: PAGE_SIZE, sortBy: "amount", sortDirection: "desc" }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    console.error("[cursor] request failed", error);
    throw new AppError("UPSTREAM", "Could not reach Cursor. Try again in a minute.");
  }

  if (response.status === 401) {
    throw new AppError(
      "VALIDATION",
      "Cursor rejected this key. Create an Admin API key (scope admin:*) at cursor.com/dashboard → API Keys.",
    );
  }
  if (response.status === 403) {
    throw new AppError(
      "VALIDATION",
      "Cursor accepted the key but denied access. The Admin API requires a Cursor Enterprise team and an admin:* key.",
    );
  }
  if (response.status === 429) {
    throw new AppError("UPSTREAM", "Cursor is rate limiting requests. Try again in a minute.");
  }
  if (!response.ok) {
    console.error("[cursor] unexpected status", response.status);
    throw new AppError("UPSTREAM", "Cursor returned an error. Try again later.");
  }

  try {
    return await response.json();
  } catch {
    throw new AppError("UPSTREAM", "Cursor returned an unreadable response.");
  }
}

/** Current billing cycle spend for every team member (POST /teams/spend, all pages). */
export async function fetchCursorSpend(apiKey: string): Promise<ProviderSpendReport> {
  const members: ProviderSpendReport["members"] = [];
  let cycleStart: Date | null = null;

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const parsed = cursorSpendPageSchema.safeParse(await postSpendPage(apiKey, page));
    if (!parsed.success) {
      console.error("[cursor] unexpected response shape", parsed.error.issues);
      throw new AppError("UPSTREAM", "Cursor returned data in an unexpected format.");
    }

    cycleStart ??= new Date(parsed.data.subscriptionCycleStart);
    members.push(...parsed.data.teamMemberSpend.map(toMemberSpend));

    const totalPages = parsed.data.totalPages ?? 1;
    if (page >= totalPages || parsed.data.teamMemberSpend.length === 0) {
      break;
    }
  }

  return { cycleStart: cycleStart ?? new Date(), members };
}

/** POST /teams/user-spend-limit. Dollars must be a whole number. */
export async function setCursorSpendLimit(
  apiKey: string,
  userEmail: string,
  spendLimitDollars: number,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/teams/user-spend-limit`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userEmail, spendLimitDollars }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    console.error("[cursor] spend limit request failed", error);
    throw new AppError("UPSTREAM", "Could not reach Cursor to set the spend limit.");
  }

  const body = (await response.json().catch(() => null)) as { outcome?: string; message?: string } | null;
  if (response.status === 401 || response.status === 403) {
    throw new AppError("VALIDATION", "Cursor refused to set a spend limit with this admin key.");
  }
  if (!response.ok || body?.outcome === "error") {
    console.error("[cursor] spend limit rejected", response.status, body?.message);
    throw new AppError("UPSTREAM", body?.message || "Cursor could not set the spend limit.");
  }
}

const DAILY_PAGE_SIZE = 200;
const DAILY_MAX_PAGES = 10;

/** Last N days of per-person usage counts. Cursor allows at most a 30-day range. */
export async function fetchCursorDailyUsage(apiKey: string, days: number): Promise<CursorDailyRow[]> {
  const end = new Date();
  const start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  const rows: CursorDailyRow[] = [];

  for (let page = 1; page <= DAILY_MAX_PAGES; page += 1) {
    let response: Response;
    try {
      response = await fetch(`${BASE_URL}/teams/daily-usage-data`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: start.getTime(),
          endDate: end.getTime(),
          page,
          pageSize: DAILY_PAGE_SIZE,
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      });
    } catch (error) {
      console.error("[cursor] daily usage request failed", error);
      throw new AppError("UPSTREAM", "Could not reach Cursor for daily usage.");
    }

    if (response.status === 429) {
      throw new AppError("UPSTREAM", "Cursor is rate limiting requests. Try again in a minute.");
    }
    if (!response.ok) {
      console.error("[cursor] daily usage status", response.status);
      throw new AppError("UPSTREAM", "Cursor could not return daily usage.");
    }

    const parsed = cursorDailyPageSchema.safeParse(await response.json().catch(() => null));
    if (!parsed.success) {
      console.error("[cursor] unexpected daily usage shape", parsed.error.issues);
      throw new AppError("UPSTREAM", "Cursor returned daily usage in an unexpected format.");
    }

    rows.push(...parsed.data.data.map(toDailyRow));
    const hasNext = parsed.data.pagination?.hasNextPage === true;
    const totalPages = parsed.data.pagination?.totalPages;
    if (!hasNext || (totalPages !== undefined && page >= totalPages) || parsed.data.data.length === 0) {
      break;
    }
  }

  return rows;
}
