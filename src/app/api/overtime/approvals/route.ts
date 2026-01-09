import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/jwt";
import { hasMinimumRole } from "@/lib/auth/roles";
import { overtimeService } from "@/services/overtime.service";

// GET - Get pending overtime requests for approval
export async function GET() {
  const session = await getSessionFromCookie();

  if (!session || !hasMinimumRole(session.role, "manager")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    let requests;
    if (session.role === "manager") {
      requests = await overtimeService.getPendingForManager();
    } else {
      // HR/Owner sees manager-approved requests
      requests = await overtimeService.getPendingForHR();
    }

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Get approvals error:", error);
    return NextResponse.json(
      { error: "Failed to get approvals" },
      { status: 500 }
    );
  }
}
