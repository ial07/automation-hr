import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/jwt";
import { hasMinimumRole } from "@/lib/auth/roles";
import { attendanceService } from "@/services/attendance.service";

// GET - Get team attendance for today
export async function GET() {
  const session = await getSessionFromCookie();

  if (!session || !hasMinimumRole(session.role, "manager")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const records = await attendanceService.getTeamToday();
    return NextResponse.json({ records });
  } catch (error) {
    console.error("Get team attendance error:", error);
    return NextResponse.json(
      { error: "Failed to get team attendance" },
      { status: 500 }
    );
  }
}
