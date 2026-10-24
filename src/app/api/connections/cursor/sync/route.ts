import { syncCursor } from "@/application/connection";
import { apiError } from "@/lib/api";
import { getOrgContext } from "@/lib/org";

export async function POST() {
  try {
    const ctx = await getOrgContext();
    const result = await syncCursor(ctx);
    return Response.json({ data: result });
  } catch (error) {
    return apiError(error);
  }
}
