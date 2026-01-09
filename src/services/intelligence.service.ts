import { createAdminClient } from "@/lib/supabase/admin";
import OpenAI from "openai";

const supabase = createAdminClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type AttentionSignal = "needs_attention" | "monitor" | "stable";

export type InsightCard = {
  id: string;
  title: string;
  description: string;
  metric: string;
  signal: AttentionSignal;
  affectedEmployees?: string[];
};

export type AttendanceFlag = {
  type: "frequent_lateness" | "excessive_leave" | "high_overtime";
  severity: "low" | "medium" | "high";
  description: string;
  employeeName: string;
  data: object;
};

export type ComprehensiveInsights = {
  period: string;
  summary: {
    totalEmployees: number;
    totalWorkingDays: number;
    attendanceRecords: number;
  };
  attendance: {
    totalPresent: number;
    totalLate: number;
    totalWfh: number;
    totalLeave: number;
    complianceRate: number;
  };
  leave: {
    pendingRequests: number;
    approvedThisMonth: number;
    rejectedThisMonth: number;
    totalDaysTaken: number;
  };
  overtime: {
    pendingRequests: number;
    approvedRequests: number;
    totalHours: number;
  };
  insightCards: InsightCard[];
  flags: AttendanceFlag[];
  aiSummary: string;
};

export const intelligenceService = {
  /**
   * Get last 30 days date range
   */
  getLast30DaysRange(): { startDate: string; endDate: string } {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  },

  /**
   * Get comprehensive HR insights for dashboard
   */
  async getComprehensiveInsights(): Promise<ComprehensiveInsights> {
    const { startDate, endDate } = this.getLast30DaysRange();

    // Get all employees
    const { data: employees } = await supabase
      .from("users")
      .select("id, full_name, email, role")
      .in("role", ["employee", "manager"]);

    const employeeMap = new Map(
      employees?.map((e) => [e.id, e.full_name || e.email]) || []
    );
    const totalEmployees = employees?.length || 0;

    // Attendance data
    const { data: attendanceData } = await supabase
      .from("attendance_records")
      .select("user_id, status, date")
      .gte("date", startDate)
      .lte("date", endDate);

    const attendanceStats = {
      totalPresent: 0,
      totalLate: 0,
      totalWfh: 0,
      totalLeave: 0,
      complianceRate: 0,
    };
    const lateCountByUser: Record<string, number> = {};

    attendanceData?.forEach((r) => {
      if (r.status === "present") attendanceStats.totalPresent++;
      if (r.status === "late") {
        attendanceStats.totalLate++;
        lateCountByUser[r.user_id] = (lateCountByUser[r.user_id] || 0) + 1;
      }
      if (r.status === "wfh") attendanceStats.totalWfh++;
      if (r.status === "leave") attendanceStats.totalLeave++;
    });

    const totalRecords = attendanceData?.length || 1;
    attendanceStats.complianceRate = Math.round(
      ((attendanceStats.totalPresent + attendanceStats.totalWfh) /
        totalRecords) *
        100
    );

    // Leave data
    const { data: leaveData } = await supabase
      .from("leave_requests")
      .select("status, total_days, employee_id")
      .gte("created_at", new Date(startDate).toISOString());

    const leaveStats = {
      pendingRequests: 0,
      approvedThisMonth: 0,
      rejectedThisMonth: 0,
      totalDaysTaken: 0,
    };
    const leaveByUser: Record<string, number> = {};

    leaveData?.forEach((r) => {
      if (r.status === "submitted" || r.status === "approved_manager")
        leaveStats.pendingRequests++;
      if (r.status === "approved_hr") {
        leaveStats.approvedThisMonth++;
        leaveStats.totalDaysTaken += r.total_days;
        leaveByUser[r.employee_id] =
          (leaveByUser[r.employee_id] || 0) + r.total_days;
      }
      if (r.status === "rejected_manager" || r.status === "rejected_hr")
        leaveStats.rejectedThisMonth++;
    });

    // Overtime data
    const { data: overtimeData } = await supabase
      .from("overtime_requests")
      .select("status, hours, employee_id")
      .gte("created_at", new Date(startDate).toISOString());

    const overtimeStats = {
      pendingRequests: 0,
      approvedRequests: 0,
      totalHours: 0,
    };
    const overtimeByUser: Record<string, number> = {};

    overtimeData?.forEach((r) => {
      if (r.status === "submitted" || r.status === "approved_manager")
        overtimeStats.pendingRequests++;
      if (r.status === "approved_hr") {
        overtimeStats.approvedRequests++;
        overtimeStats.totalHours += Number(r.hours);
        overtimeByUser[r.employee_id] =
          (overtimeByUser[r.employee_id] || 0) + Number(r.hours);
      }
    });

    // Generate insight cards
    const insightCards: InsightCard[] = [];

    // Late attendance card
    const lateSignal: AttentionSignal =
      attendanceStats.totalLate > 10
        ? "needs_attention"
        : attendanceStats.totalLate > 5
        ? "monitor"
        : "stable";
    insightCards.push({
      id: "late-trend",
      title: "Tren Keterlambatan",
      description:
        attendanceStats.totalLate > 5
          ? "Terdapat peningkatan keterlambatan yang perlu diperhatikan."
          : "Keterlambatan dalam batas normal.",
      metric: `${attendanceStats.totalLate} keterlambatan dalam 30 hari`,
      signal: lateSignal,
      affectedEmployees: Object.entries(lateCountByUser)
        .filter(([, count]) => count >= 2)
        .map(([id]) => employeeMap.get(id) || "Unknown"),
    });

    // Overtime card
    const otSignal: AttentionSignal =
      overtimeStats.totalHours > 50
        ? "needs_attention"
        : overtimeStats.totalHours > 20
        ? "monitor"
        : "stable";
    insightCards.push({
      id: "overtime-usage",
      title: "Penggunaan Lembur",
      description:
        overtimeStats.totalHours > 50
          ? "Jam lembur tinggi, pertimbangkan distribusi beban kerja."
          : "Penggunaan lembur dalam batas wajar.",
      metric: `${overtimeStats.totalHours} jam lembur disetujui`,
      signal: otSignal,
      affectedEmployees: Object.entries(overtimeByUser)
        .filter(([, hours]) => hours >= 5)
        .map(([id]) => employeeMap.get(id) || "Unknown"),
    });

    // Leave utilization card
    const leaveSignal: AttentionSignal =
      leaveStats.totalDaysTaken > 20 ? "monitor" : "stable";
    insightCards.push({
      id: "leave-utilization",
      title: "Utilisasi Cuti",
      description: `${leaveStats.approvedThisMonth} pengajuan cuti disetujui periode ini.`,
      metric: `${leaveStats.totalDaysTaken} hari cuti diambil`,
      signal: leaveSignal,
    });

    // Compliance card
    const complianceSignal: AttentionSignal =
      attendanceStats.complianceRate < 80
        ? "needs_attention"
        : attendanceStats.complianceRate < 90
        ? "monitor"
        : "stable";
    insightCards.push({
      id: "compliance-rate",
      title: "Tingkat Kepatuhan",
      description:
        attendanceStats.complianceRate >= 90
          ? "Tingkat kehadiran tepat waktu sangat baik."
          : "Perlu peningkatan kepatuhan waktu kehadiran.",
      metric: `${attendanceStats.complianceRate}% kehadiran tepat waktu`,
      signal: complianceSignal,
    });

    // Generate flags
    const flags: AttendanceFlag[] = [];

    for (const [userId, count] of Object.entries(lateCountByUser)) {
      if (count >= 3) {
        flags.push({
          type: "frequent_lateness",
          severity: count >= 5 ? "high" : "medium",
          description: `Terlambat ${count} kali dalam 30 hari`,
          employeeName: employeeMap.get(userId) || "Unknown",
          data: { lateCount: count },
        });
      }
    }

    for (const [userId, hours] of Object.entries(overtimeByUser)) {
      if (hours >= 10) {
        flags.push({
          type: "high_overtime",
          severity: hours >= 15 ? "high" : "medium",
          description: `Lembur ${hours} jam dalam 30 hari`,
          employeeName: employeeMap.get(userId) || "Unknown",
          data: { overtimeHours: hours },
        });
      }
    }

    // Generate AI summary
    const aiSummary = await this.generateAISummary({
      totalEmployees,
      attendance: attendanceStats,
      leave: leaveStats,
      overtime: overtimeStats,
      flags,
    });

    return {
      period: `${startDate} - ${endDate}`,
      summary: {
        totalEmployees,
        totalWorkingDays: 22, // Approximate
        attendanceRecords: totalRecords,
      },
      attendance: attendanceStats,
      leave: leaveStats,
      overtime: overtimeStats,
      insightCards,
      flags,
      aiSummary,
    };
  },

  /**
   * Generate AI summary in Indonesian
   */
  async generateAISummary(data: {
    totalEmployees: number;
    attendance: {
      totalPresent: number;
      totalLate: number;
      complianceRate: number;
    };
    leave: { approvedThisMonth: number; totalDaysTaken: number };
    overtime: { totalHours: number };
    flags: AttendanceFlag[];
  }): Promise<string> {
    const prompt = `Anda adalah analis HR. Buat ringkasan singkat (3-4 kalimat) dalam bahasa Indonesia berdasarkan data berikut:

DATA HR BULAN INI:
- Total karyawan: ${data.totalEmployees}
- Kehadiran tepat waktu: ${data.attendance.complianceRate}%
- Total keterlambatan: ${data.attendance.totalLate} kali
- Cuti diambil: ${data.leave.totalDaysTaken} hari
- Lembur disetujui: ${data.overtime.totalHours} jam
- Karyawan dengan perhatian khusus: ${data.flags.length} orang

Berikan ringkasan kondisi HR secara umum, fokus pada fakta. Gunakan bahasa bisnis profesional, bukan teknis.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 300,
      });
      return (
        response.choices[0]?.message?.content || "Ringkasan tidak tersedia."
      );
    } catch (error) {
      console.error("AI Summary error:", error);
      return `Kondisi HR bulan ini: ${data.attendance.complianceRate}% kepatuhan kehadiran, ${data.attendance.totalLate} keterlambatan, ${data.leave.totalDaysTaken} hari cuti diambil.`;
    }
  },

  // Keep legacy method for backward compatibility
  async getOrganizationInsights() {
    const insights = await this.getComprehensiveInsights();
    return {
      attendance: insights.attendance,
      leave: insights.leave,
      overtime: insights.overtime,
      flags: insights.flags.map((f) => ({
        type: f.type,
        severity: f.severity,
        description: f.description,
        data: f.data,
      })),
    };
  },
};
