import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/jwt";
import { leaveService } from "@/services/leave.service";
import { leavePolicyService } from "@/services/leavePolicy.service";
import { CreateLeaveRequestInput, LeaveType } from "@/types/leave";

// GET - List user's leave requests
export async function GET() {
  const session = await getSessionFromCookie();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const requests = await leaveService.getEmployeeRequests(session.userId);
    const balance = await leaveService.getBalance(session.userId);

    return NextResponse.json({ requests, balance });
  } catch (error) {
    console.error("Get leave requests error:", error);
    return NextResponse.json(
      { error: "Failed to get requests" },
      { status: 500 }
    );
  }
}

// POST - Submit new leave request
export async function POST(request: Request) {
  const session = await getSessionFromCookie();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: CreateLeaveRequestInput = await request.json();

    // Validate required fields
    if (!body.leave_type || !body.start_date || !body.end_date) {
      return NextResponse.json(
        { error: "Jenis cuti, tanggal mulai, dan tanggal akhir wajib diisi." },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(body.start_date);
    const end = new Date(body.end_date);
    if (end < start) {
      return NextResponse.json(
        { error: "Tanggal akhir harus setelah tanggal mulai." },
        { status: 400 }
      );
    }

    // Policy validation
    const policyCheck = await leavePolicyService.validateRequest(
      session.userId,
      body.leave_type as LeaveType,
      body.start_date,
      body.end_date
    );

    if (!policyCheck.eligible) {
      return NextResponse.json(
        {
          error: policyCheck.message,
          policyCheck,
        },
        { status: 400 }
      );
    }

    // Create request
    const leaveRequest = await leaveService.submitRequest(
      session.userId,
      body,
      policyCheck
    );

    return NextResponse.json(
      { request: leaveRequest, policyCheck },
      { status: 201 }
    );
  } catch (error) {
    console.error("Submit leave request error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to submit request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
