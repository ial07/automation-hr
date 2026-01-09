import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/jwt";
import { overtimeService } from "@/services/overtime.service";

// GET - Get user's overtime requests
export async function GET() {
  const session = await getSessionFromCookie();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const requests = await overtimeService.getEmployeeRequests(session.userId);
    const monthlyTotal = await overtimeService.getMonthlyTotal(session.userId);

    return NextResponse.json({ requests, monthlyTotal });
  } catch (error) {
    console.error("Get overtime error:", error);
    return NextResponse.json(
      { error: "Failed to get overtime" },
      { status: 500 }
    );
  }
}

// POST - Submit new overtime request
export async function POST(request: Request) {
  const session = await getSessionFromCookie();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { date, start_time, end_time, reason } = body;

    if (!date || !start_time || !end_time || !reason) {
      return NextResponse.json(
        { error: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    const overtimeRequest = await overtimeService.submitRequest(
      session.userId,
      {
        date,
        start_time,
        end_time,
        reason,
      }
    );

    return NextResponse.json({ request: overtimeRequest }, { status: 201 });
  } catch (error) {
    console.error("Submit overtime error:", error);
    const message = error instanceof Error ? error.message : "Failed to submit";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
