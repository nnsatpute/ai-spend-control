import { savePersonBudget } from "@/application/budget";
import { apiError } from "@/lib/api";
import { getOrgContext } from "@/lib/org";

export async function POST(request: Request) {
  try {
    const ctx = await getOrgContext();
    const body = await request.json().catch(() => ({}));
    await savePersonBudget(ctx, {
      personId: body?.personId,
      amountDollars: body?.amountDollars,
      managerEmail: body?.managerEmail,
    });
    return Response.json({ data: { ok: true } });
  } catch (error) {
    return apiError(error);
  }
}