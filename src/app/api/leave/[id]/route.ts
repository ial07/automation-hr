import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/jwt";
import { hasMinimumRole } from "@/lib/auth/roles";
import { leaveService } from "@/services/leave.service";
import { leaveRepository } from "@/repositories/leave.repository";

type RouteParams = { params: Promise<{ id: string }> };

// GET - Get single leave request
export async function GET(request: Request, { params }: RouteParams) {
  const session = await getSessionFromCookie();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const leaveRequest = await leaveRepository.findRequestById(id);

    if (!leaveRequest) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check access: own request or manager/hr/owner
    const isOwn = leaveRequest.employee_id === session.userId;
    const isApprover = hasMinimumRole(session.role, "manager");

    if (!isOwn && !isApprover) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ request: leaveRequest });
  } catch (error) {
    console.error("Get leave request error:", error);
    return NextResponse.json(
      { error: "Failed to get request" },
      { status: 500 }
    );
  }
}

// PATCH - Approve/Reject leave request
export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getSessionFromCookie();

  if (!session || !hasMinimumRole(session.role, "manager")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { action, notes } = await request.json();

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    const leaveRequest = await leaveRepository.findRequestById(id);
    if (!leaveRequest) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Determine if this is manager or HR action
    if (leaveRequest.status === "submitted") {
      // Manager action
      await leaveService.managerAction(id, session.userId, action, notes);
    } else if (
      leaveRequest.status === "approved_manager" &&
      hasMinimumRole(session.role, "hr")
    ) {
      // HR action
      await leaveService.hrAction(id, session.userId, action, notes);
    } else {
      return NextResponse.json(
        { error: "Request tidak dapat diproses pada status ini." },
        { status: 400 }
      );
    }

    const updated = await leaveRepository.findRequestById(id);
    return NextResponse.json({ request: updated });
  } catch (error) {
    console.error("Update leave request error:", error);
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 }
    );
  }
}
