import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/jwt";
import { attendanceService } from "@/services/attendance.service";

// GET - Get today's status and recent history
export async function GET() {
  const session = await getSessionFromCookie();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = await attendanceService.getTodayStatus(session.userId);
    const history = await attendanceService.getHistory(session.userId);

    return NextResponse.json({ today, history });
  } catch (error) {
    console.error("Get attendance error:", error);
    return NextResponse.json(
      { error: "Failed to get attendance" },
      { status: 500 }
    );
  }
}

// POST - Check In or OUT
export async function POST(request: Request) {
  const session = await getSessionFromCookie();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, notes, is_wfh } = body;

    if (action === "check-in") {
      const record = await attendanceService.checkIn(session.userId, {
        notes,
        is_wfh,
      });
      return NextResponse.json({ record }, { status: 201 });
    }

    if (action === "check-out") {
      const record = await attendanceService.checkOut(session.userId, {
        notes,
      });
      return NextResponse.json({ record });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Attendance action error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process attendance";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
