import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/jwt";
import { hasMinimumRole } from "@/lib/auth/roles";
import { overtimeService } from "@/services/overtime.service";

// PATCH - Approve or reject overtime request
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromCookie();
  const { id } = await params;

  if (!session || !hasMinimumRole(session.role, "manager")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, notes } = body;

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (session.role === "manager") {
      await overtimeService.managerAction(id, session.userId, action, notes);
    } else {
      await overtimeService.hrAction(id, session.userId, action, notes);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Overtime action error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
