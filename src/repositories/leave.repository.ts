import { createAdminClient } from "@/lib/supabase/admin";
import {
  LeaveRequest,
  LeaveBalance,
  LeaveType,
  LeaveStatus,
  CreateLeaveRequestInput,
} from "@/types/leave";

const supabase = createAdminClient();

export const leaveRepository = {
  // Leave Requests
  async createRequest(
    employeeId: string,
    input: CreateLeaveRequestInput & {
      total_days: number;
      policy_check_result?: object;
    }
  ): Promise<LeaveRequest> {
    const { data, error } = await supabase
      .from("leave_requests")
      .insert({
        employee_id: employeeId,
        leave_type: input.leave_type,
        start_date: input.start_date,
        end_date: input.end_date,
        total_days: input.total_days,
        reason: input.reason,
        status: "submitted",
        policy_check_result: input.policy_check_result,
      })
      .select()
      .single();

    if (error)
      throw new Error(`Failed to create leave request: ${error.message}`);
    return data;
  },

  async findRequestById(id: string): Promise<LeaveRequest | null> {
    const { data, error } = await supabase
      .from("leave_requests")
      .select("*, employee:users!employee_id(full_name, email)")
      .eq("id", id)
      .single();

    if (error) return null;
    return data;
  },

  async findRequestsByEmployee(employeeId: string): Promise<LeaveRequest[]> {
    const { data, error } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to fetch requests: ${error.message}`);
    return data || [];
  },

  async findPendingForManager(): Promise<LeaveRequest[]> {
    const { data, error } = await supabase
      .from("leave_requests")
      .select("*, employee:users!employee_id(full_name, email)")
      .eq("status", "submitted")
      .order("created_at", { ascending: true });

    if (error)
      throw new Error(`Failed to fetch pending requests: ${error.message}`);
    return data || [];
  },

  async findPendingForHR(): Promise<LeaveRequest[]> {
    const { data, error } = await supabase
      .from("leave_requests")
      .select("*, employee:users!employee_id(full_name, email)")
      .eq("status", "approved_manager")
      .order("created_at", { ascending: true });

    if (error)
      throw new Error(`Failed to fetch HR pending requests: ${error.message}`);
    return data || [];
  },

  async updateStatus(
    id: string,
    status: LeaveStatus,
    approverId: string,
    notes?: string
  ): Promise<void> {
    const isManagerAction =
      status === "approved_manager" || status === "rejected_manager";
    const updateData: Record<string, unknown> = { status };

    if (isManagerAction) {
      updateData.manager_id = approverId;
      updateData.manager_notes = notes || null;
      updateData.manager_action_at = new Date().toISOString();
    } else {
      updateData.hr_id = approverId;
      updateData.hr_notes = notes || null;
      updateData.hr_action_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("leave_requests")
      .update(updateData)
      .eq("id", id);

    if (error) throw new Error(`Failed to update status: ${error.message}`);
  },

  // Leave Balances
  async getOrCreateBalance(userId: string): Promise<LeaveBalance> {
    // Try to get existing
    const { data: existing } = await supabase
      .from("leave_balances")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (existing) return existing;

    // Create new balance
    const { data, error } = await supabase
      .from("leave_balances")
      .insert({ user_id: userId })
      .select()
      .single();

    if (error) throw new Error(`Failed to create balance: ${error.message}`);
    return data;
  },

  async updateBalanceUsed(
    userId: string,
    leaveType: LeaveType,
    daysToAdd: number
  ): Promise<void> {
    const balance = await this.getOrCreateBalance(userId);

    const field = leaveType === "annual" ? "annual_used" : "sick_used";
    const newValue =
      (leaveType === "annual" ? balance.annual_used : balance.sick_used) +
      daysToAdd;

    const { error } = await supabase
      .from("leave_balances")
      .update({ [field]: newValue })
      .eq("user_id", userId);

    if (error) throw new Error(`Failed to update balance: ${error.message}`);
  },
};
