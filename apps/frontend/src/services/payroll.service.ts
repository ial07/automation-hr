import { createAdminClient } from "@/lib/supabase/admin";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const supabase = createAdminClient();

// Dummy salary constants
const DUMMY_BASIC_SALARY = 8000000; // IDR 8 juta
const DUMMY_ALLOWANCE = 1500000; // IDR 1.5 juta
const OVERTIME_RATE_PER_HOUR = 75000; // IDR 75rb per jam

export type PayrollData = {
  employeeId: string;
  employeeName: string;
  email: string;
  position: string;
  month: string;
  year: number;
  basicSalary: number;
  allowance: number;
  overtimePay: number;
  overtimeHours: number;
  deduction: number;
  totalSalary: number;
  generatedDate: string;
};

export const payrollService = {
  /**
   * Get employee data by ID
   */
  async getEmployeeById(employeeId: string) {
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email, role")
      .eq("id", employeeId)
      .single();

    if (error) throw new Error("Employee not found");
    return data;
  },

  /**
   * Get overtime hours for employee in a specific month
   */
  async getOvertimeHours(
    employeeId: string,
    year: number,
    month: number
  ): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const { data } = await supabase
      .from("overtime_requests")
      .select("hours")
      .eq("employee_id", employeeId)
      .eq("status", "approved_hr")
      .gte("overtime_date", startDate.toISOString().split("T")[0])
      .lte("overtime_date", endDate.toISOString().split("T")[0]);

    if (!data) return 0;
    return data.reduce((sum, r) => sum + Number(r.hours), 0);
  },

  /**
   * Generate dummy payroll data
   */
  async generatePayrollData(
    employeeId: string,
    year: number,
    month: number
  ): Promise<PayrollData> {
    const employee = await this.getEmployeeById(employeeId);
    const overtimeHours = await this.getOvertimeHours(employeeId, year, month);

    const basicSalary = DUMMY_BASIC_SALARY;
    const allowance = DUMMY_ALLOWANCE;
    const overtimePay = overtimeHours * OVERTIME_RATE_PER_HOUR;
    const deduction = 0;
    const totalSalary = basicSalary + allowance + overtimePay - deduction;

    const monthNames = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    return {
      employeeId: employee.id,
      employeeName: employee.full_name || employee.email,
      email: employee.email,
      position:
        employee.role === "manager"
          ? "Manager"
          : employee.role === "hr"
          ? "HR Staff"
          : "Staff",
      month: monthNames[month - 1],
      year,
      basicSalary,
      allowance,
      overtimePay,
      overtimeHours,
      deduction,
      totalSalary,
      generatedDate: new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    };
  },

  /**
   * Generate PDF buffer from payroll data using pdf-lib
   */
  async generatePDF(data: PayrollData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size

    // Embed fonts
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const { height } = page.getSize();

    // Helper function to format currency
    const formatCurrency = (amount: number) =>
      `Rp ${amount.toLocaleString("id-ID")}`;

    let y = height - 50;

    // ===== HEADER =====
    page.drawText("PT. COMPANY NAME", {
      x: 50,
      y,
      size: 20,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    y -= 20;

    page.drawText("Jl. Contoh Alamat No. 123, Jakarta", {
      x: 50,
      y,
      size: 10,
      font: helvetica,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= 15;

    // Separator line
    page.drawLine({
      start: { x: 50, y },
      end: { x: 545, y },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
    y -= 30;

    // ===== TITLE =====
    page.drawText("SLIP GAJI", {
      x: 250,
      y,
      size: 18,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    y -= 20;

    page.drawText(`Periode: ${data.month} ${data.year}`, {
      x: 230,
      y,
      size: 12,
      font: helvetica,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 40;

    // ===== EMPLOYEE INFO =====
    page.drawText("Informasi Karyawan", {
      x: 50,
      y,
      size: 12,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    y -= 20;

    const employeeInfo = [
      [`Nama`, data.employeeName],
      [`Email`, data.email],
      [`Jabatan`, data.position],
    ];

    for (const [label, value] of employeeInfo) {
      page.drawText(`${label}:`, {
        x: 50,
        y,
        size: 10,
        font: helveticaBold,
        color: rgb(0.3, 0.3, 0.3),
      });
      page.drawText(value, {
        x: 120,
        y,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0),
      });
      y -= 16;
    }
    y -= 20;

    // ===== SALARY BREAKDOWN =====
    page.drawText("Rincian Gaji", {
      x: 50,
      y,
      size: 12,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    y -= 25;

    // Table header background
    page.drawRectangle({
      x: 50,
      y: y - 5,
      width: 495,
      height: 20,
      color: rgb(0.95, 0.95, 0.95),
    });

    page.drawText("Komponen", {
      x: 60,
      y,
      size: 10,
      font: helveticaBold,
      color: rgb(0.3, 0.3, 0.3),
    });
    page.drawText("Jumlah", {
      x: 430,
      y,
      size: 10,
      font: helveticaBold,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= 25;

    const salaryRows = [
      ["Gaji Pokok", formatCurrency(data.basicSalary)],
      ["Tunjangan", formatCurrency(data.allowance)],
      [`Lembur (${data.overtimeHours} jam)`, formatCurrency(data.overtimePay)],
      ["Potongan", formatCurrency(data.deduction)],
    ];

    for (const [label, value] of salaryRows) {
      page.drawText(label, {
        x: 60,
        y,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0),
      });
      page.drawText(value, {
        x: 430,
        y,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0),
      });
      y -= 18;
    }

    // Separator line
    y -= 5;
    page.drawLine({
      start: { x: 50, y },
      end: { x: 545, y },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
    y -= 20;

    // Total
    page.drawText("TOTAL GAJI", {
      x: 60,
      y,
      size: 12,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    page.drawText(formatCurrency(data.totalSalary), {
      x: 410,
      y,
      size: 12,
      font: helveticaBold,
      color: rgb(0.1, 0.5, 0.1),
    });
    y -= 60;

    // ===== FOOTER =====
    page.drawText(
      `Dokumen ini digenerate secara otomatis pada ${data.generatedDate}`,
      {
        x: 130,
        y,
        size: 9,
        font: helvetica,
        color: rgb(0.5, 0.5, 0.5),
      }
    );
    y -= 14;
    page.drawText(
      "Slip gaji ini adalah dokumen resmi dan tidak memerlukan tanda tangan.",
      {
        x: 115,
        y,
        size: 9,
        font: helvetica,
        color: rgb(0.5, 0.5, 0.5),
      }
    );

    return await pdfDoc.save();
  },

  /**
   * Get list of employees for HR/Owner selection
   */
  async getEmployeeList() {
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email, role")
      .in("role", ["employee", "manager", "hr"])
      .order("full_name");

    if (error) throw new Error("Failed to fetch employees");
    return data || [];
  },
};
