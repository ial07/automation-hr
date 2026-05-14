import { createAdminClient } from "@/lib/supabase/admin";
import {
  AttendanceRecord,
  AttendanceStatus,
  CheckInInput,
  CheckOutInput,
} from "@/types/attendance";

const supabase = createAdminClient();

// Helper to get today's date string (YYYY-MM-DD) in Jakarta time
function getTodayDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

export const attendanceRepository = {
  async getTodayRecord(userId: string): Promise<AttendanceRecord | null> {
    const today = getTodayDate();

    const { data, error } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is not found
      throw new Error(`Failed to get attendance: ${error.message}`);
    }

    return data;
  },

  async createCheckIn(
    userId: string,
    status: AttendanceStatus,
    notes?: string
  ): Promise<AttendanceRecord> {
    const today = getTodayDate();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("attendance_records")
      .insert({
        user_id: userId,
        date: today,
        check_in_time: now,
        status,
        notes,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to check in: ${error.message}`);
    return data;
  },

  async updateCheckOut(
    recordId: string,
    notes?: string
  ): Promise<AttendanceRecord> {
    const now = new Date().toISOString();
    const updateData: any = { check_out_time: now };

    if (notes) {
      updateData.notes = notes; // Append or replace? Simple replacement for now or append if logic needed
      // Ideally append, but let's replace/update as per standard edit
    }

    const { data, error } = await supabase
      .from("attendance_records")
      .update(updateData)
      .eq("id", recordId)
      .select()
      .single();

    if (error) throw new Error(`Failed to check out: ${error.message}`);
    return data;
  },

  async getHistory(
    userId: string,
    limit: number = 30
  ): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to get history: ${error.message}`);
    return data || [];
  },

  async getTeamToday(date?: string): Promise<AttendanceRecord[]> {
    const targetDate = date || getTodayDate();

    const { data, error } = await supabase
      .from("attendance_records")
      .select("*, user:users!user_id(full_name, email)")
      .eq("date", targetDate)
      .order("check_in_time", { ascending: true });

    if (error)
      throw new Error(`Failed to get team attendance: ${error.message}`);
    return data || [];
  },

  /**
   * Check if attendance exists for a date range (for leave validation)
   */
  async hasAttendanceInRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{ hasAttendance: boolean; dates: string[] }> {
    const { data, error } = await supabase
      .from("attendance_records")
      .select("date, status")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .in("status", ["present", "late", "wfh"]); // Only check actual attendance

    if (error) throw new Error(`Failed to check attendance: ${error.message}`);

    const dates = data?.map((d) => d.date) || [];
    return { hasAttendance: dates.length > 0, dates };
  },

  /**
   * Create leave attendance records for approved leave
   */
  async createLeaveRecords(
    userId: string,
    leaveRequestId: string,
    startDate: string,
    endDate: string
  ): Promise<void> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const records = [];

    const current = new Date(start);
    while (current <= end) {
      const day = current.getDay();
      // Skip weekends
      if (day !== 0 && day !== 6) {
        records.push({
          user_id: userId,
          date: current.toISOString().split("T")[0],
          status: "leave",
          leave_request_id: leaveRequestId,
        });
      }
      current.setDate(current.getDate() + 1);
    }

    if (records.length > 0) {
      const { error } = await supabase
        .from("attendance_records")
        .upsert(records, { onConflict: "user_id,date" });

      if (error)
        throw new Error(`Failed to create leave records: ${error.message}`);
    }
  },

  /**
   * Get attendance stats for a user (month)
   */
  async getMonthlyStats(userId: string): Promise<{
    present: number;
    late: number;
    wfh: number;
    leave: number;
    absent: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startDate = startOfMonth.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("attendance_records")
      .select("status")
      .eq("user_id", userId)
      .gte("date", startDate);

    if (error) throw new Error(`Failed to get stats: ${error.message}`);

    const stats = { present: 0, late: 0, wfh: 0, leave: 0, absent: 0 };
    data?.forEach((r) => {
      if (r.status in stats) {
        stats[r.status as keyof typeof stats]++;
      }
    });

    return stats;
  },
};
