import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/jwt";

export async function GET() {
  const session = await getSessionFromCookie();

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: session.userId,
      email: session.email,
      fullName: session.fullName,
      role: session.role,
    },
  });
}
