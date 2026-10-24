import { NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/application/auth";
import { apiStatusFromError, toApiErrorBody } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await resetPasswordWithToken(
      body?.token ?? "",
      body?.password ?? "",
    );
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json(toApiErrorBody(error), {
      status: apiStatusFromError(error),
    });
  }
}
