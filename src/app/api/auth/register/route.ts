import { NextResponse } from "next/server";
import { registerUser } from "@/application/auth";
import { apiStatusFromError, toApiErrorBody } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await registerUser({
      email: body?.email,
      password: body?.password,
      orgName: body?.orgName,
    });
    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    return NextResponse.json(toApiErrorBody(error), {
      status: apiStatusFromError(error),
    });
  }
}
