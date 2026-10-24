import { connectCursor, disconnectCursor } from "@/application/connection";
import { apiError } from "@/lib/api";
import { getOrgContext } from "@/lib/org";

export async function POST(request: Request) {
  try {
    const ctx = await getOrgContext();
    const body = await request.json().catch(() => ({}));
    const result = await connectCursor(ctx, body?.apiKey);
    return Response.json({ data: result }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE() {
  try {
    const ctx = await getOrgContext();
    await disconnectCursor(ctx);
    return new Response(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
