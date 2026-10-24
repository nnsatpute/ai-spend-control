import { importManagerCsv } from "@/application/usage/managers.service";
import { apiError } from "@/lib/api";
import { getOrgContext } from "@/lib/org";

export async function POST(request: Request) {
  try {
    const ctx = await getOrgContext();
    const body = await request.json().catch(() => ({}));
    const csv = typeof body?.csv === "string" ? body.csv : "";
    const result = await importManagerCsv(ctx, csv);
    return Response.json({ data: result });
  } catch (error) {
    return apiError(error);
  }
}
