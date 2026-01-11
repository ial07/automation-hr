import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/jwt";
import { hasMinimumRole } from "@/lib/auth/roles";
import { payrollService } from "@/services/payroll.service";

// GET - Get list of employees (for HR/Owner to select)
export async function GET() {
  const session = await getSessionFromCookie();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only HR and Owner can get employee list
  if (!hasMinimumRole(session.role, "hr")) {
    // For regular employees, return only their own info
    return NextResponse.json({
      employees: [
        {
          id: session.userId,
          full_name: "Anda",
          email: "",
          isSelf: true,
        },
      ],
    });
  }

  try {
    const employees = await payrollService.getEmployeeList();
    return NextResponse.json({ employees });
  } catch (error) {
    console.error("Get employees error:", error);
    return NextResponse.json(
      { error: "Failed to get employees" },
      { status: 500 }
    );
  }
}
