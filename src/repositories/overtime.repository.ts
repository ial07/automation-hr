import { createAdminClient } from "@/lib/supabase/admin";
import {
  OvertimeRequest,
  OvertimeStatus,
  CreateOvertimeInput,
} from "@/types/overtime";

const supabase = createAdminClient();

export const overtimeRepository = {
  async create(
    employeeId: string,
    input: CreateOvertimeInput & {
      hours: number;
      attendance_record_id?: string;
    }
  ): Promise<OvertimeRequest> {
    const { data, error } = await supabase
      .from("overtime_requests")
      .insert({
        employee_id: employeeId,
        date: input.date,
        start_time: input.start_time,
        end_time: input.end_time,
        hours: input.hours,
        reason: input.reason,
        attendance_record_id: input.attendance_record_id,
        status: "submitted",
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create overtime: ${error.message}`);
    return data;
  },

  async findByEmployee(employeeId: string): Promise<OvertimeRequest[]> {
    const { data, error } = await supabase
      .from("overtime_requests")
      .select("*")
      .eq("employee_id", employeeId)
      .order("date", { ascending: false });

    if (error) throw new Error(`Failed to fetch overtime: ${error.message}`);
    return data || [];
  },

  async findById(id: string): Promise<OvertimeRequest | null> {
    const { data, error } = await supabase
      .from("overtime_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to fetch overtime: ${error.message}`);
    }
    return data;
  },

  async findPendingForManager(): Promise<OvertimeRequest[]> {
    const { data, error } = await supabase
      .from("overtime_requests")
      .select("*, employee:users!employee_id(full_name, email)")
      .eq("status", "submitted")
      .order("created_at", { ascending: true });

    if (error) throw new Error(`Failed to fetch pending: ${error.message}`);
    return data || [];
  },

  async findPendingForHR(): Promise<OvertimeRequest[]> {
    const { data, error } = await supabase
      .from("overtime_requests")
      .select("*, employee:users!employee_id(full_name, email)")
      .eq("status", "approved_manager")
      .order("created_at", { ascending: true });

    if (error) throw new Error(`Failed to fetch pending: ${error.message}`);
    return data || [];
  },

  async updateStatus(
    id: string,
    status: OvertimeStatus,
    approvedBy: string,
    notes?: string
  ): Promise<void> {
    const { error } = await supabase
      .from("overtime_requests")
      .update({
        status,
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        notes,
      })
      .eq("id", id);

    if (error) throw new Error(`Failed to update status: ${error.message}`);
  },

  async getMonthlyTotal(employeeId: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data, error } = await supabase
      .from("overtime_requests")
      .select("hours")
      .eq("employee_id", employeeId)
      .eq("status", "approved_hr")
      .gte("date", startOfMonth.toISOString().split("T")[0]);

    if (error) throw new Error(`Failed to get total: ${error.message}`);
    return data?.reduce((sum, r) => sum + Number(r.hours), 0) || 0;
  },
};
