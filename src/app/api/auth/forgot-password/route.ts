import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/application/auth";
import { apiStatusFromError, toApiErrorBody } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await requestPasswordReset(body?.email ?? "");
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json(toApiErrorBody(error), {
      status: apiStatusFromError(error),
    });
  }
}
