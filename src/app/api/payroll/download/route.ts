import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/jwt";
import { hasMinimumRole } from "@/lib/auth/roles";
import { payrollService } from "@/services/payroll.service";

// GET - Download payroll PDF
export async function GET(request: Request) {
  const session = await getSessionFromCookie();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetEmployeeId = searchParams.get("employeeId");
  const month = parseInt(searchParams.get("month") || "");
  const year = parseInt(searchParams.get("year") || "");

  // Validate month and year
  if (!month || !year || month < 1 || month > 12) {
    return NextResponse.json(
      { error: "Invalid month or year" },
      { status: 400 }
    );
  }

  let employeeIdToFetch: string;

  // ACCESS CONTROL
  if (!targetEmployeeId || targetEmployeeId === session.userId) {
    // User requesting their own payroll - always allowed
    employeeIdToFetch = session.userId;
  } else {
    // User requesting another employee's payroll
    // Only HR and Owner can do this
    if (!hasMinimumRole(session.role, "hr")) {
      return NextResponse.json(
        {
          error:
            "Akses ditolak. Anda hanya dapat mengunduh slip gaji milik Anda sendiri.",
        },
        { status: 403 }
      );
    }
    employeeIdToFetch = targetEmployeeId;
  }

  try {
    // Generate payroll data
    const payrollData = await payrollService.generatePayrollData(
      employeeIdToFetch,
      year,
      month
    );

    // Generate PDF
    const pdfBuffer = await payrollService.generatePDF(payrollData);

    // Create filename
    const safeName = payrollData.employeeName
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
    const filename = `payroll_${safeName}_${payrollData.month.toLowerCase()}_${year}.pdf`;

    // Return PDF for download
    const arrayBuffer = pdfBuffer.buffer.slice(
      pdfBuffer.byteOffset,
      pdfBuffer.byteOffset + pdfBuffer.byteLength
    ) as ArrayBuffer;
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Payroll generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate payroll" },
      { status: 500 }
    );
  }
}
