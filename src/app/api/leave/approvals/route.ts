import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/jwt";
import { hasMinimumRole } from "@/lib/auth/roles";
import { leaveService } from "@/services/leave.service";

// GET - Get pending requests for approval
export async function GET() {
  const session = await getSessionFromCookie();

  if (!session || !hasMinimumRole(session.role, "manager")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // Manager sees submitted requests
    const managerPending = await leaveService.getPendingForManager();

    // HR also sees manager-approved requests
    let hrPending: Awaited<ReturnType<typeof leaveService.getPendingForHR>> =
      [];
    if (hasMinimumRole(session.role, "hr")) {
      hrPending = await leaveService.getPendingForHR();
    }

    return NextResponse.json({
      managerPending,
      hrPending,
      total: managerPending.length + hrPending.length,
    });
  } catch (error) {
    console.error("Get approvals error:", error);
    return NextResponse.json(
      { error: "Failed to get approvals" },
      { status: 500 }
    );
  }
}
