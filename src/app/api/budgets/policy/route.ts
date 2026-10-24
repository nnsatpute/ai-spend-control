import { savePolicy } from "@/application/budget";
import { apiError } from "@/lib/api";
import { getOrgContext } from "@/lib/org";

export async function POST(request: Request) {
  try {
    const ctx = await getOrgContext();
    const body = await request.json().catch(() => ({}));
    await savePolicy(ctx, {
      amountDollars: body?.amountDollars,
      mode: body?.mode,
      actionAt100: body?.actionAt100,
      slackWebhook: body?.slackWebhook,
    });
    return Response.json({ data: { ok: true } });
  } catch (error) {
    return apiError(error);
  }
}
