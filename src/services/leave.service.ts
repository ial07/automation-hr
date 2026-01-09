import { leaveRepository } from "@/repositories/leave.repository";
import {
  LeaveType,
  LeaveStatus,
  LeaveRequest,
  LeaveBalance,
  CreateLeaveRequestInput,
} from "@/types/leave";

/**
 * Calculate working days between two dates (excluding weekends)
 */
function calculateWorkingDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;

  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

export const leaveService = {
  /**
   * Submit a new leave request
   */
  async submitRequest(
    employeeId: string,
    input: CreateLeaveRequestInput,
    policyCheckResult?: object
  ): Promise<LeaveRequest> {
    const totalDays = calculateWorkingDays(input.start_date, input.end_date);

    if (totalDays <= 0) {
      throw new Error(
        "Tanggal tidak valid. Pastikan tanggal akhir setelah tanggal mulai."
      );
    }

    return leaveRepository.createRequest(employeeId, {
      ...input,
      total_days: totalDays,
      policy_check_result: policyCheckResult,
    });
  },

  /**
   * Get employee's leave requests
   */
  async getEmployeeRequests(employeeId: string): Promise<LeaveRequest[]> {
    return leaveRepository.findRequestsByEmployee(employeeId);
  },

  /**
   * Get pending requests for manager approval
   */
  async getPendingForManager(): Promise<LeaveRequest[]> {
    return leaveRepository.findPendingForManager();
  },

  /**
   * Get pending requests for HR approval
   */
  async getPendingForHR(): Promise<LeaveRequest[]> {
    return leaveRepository.findPendingForHR();
  },

  /**
   * Manager approves/rejects request
   */
  async managerAction(
    requestId: string,
    managerId: string,
    action: "approve" | "reject",
    notes?: string
  ): Promise<void> {
    const status: LeaveStatus =
      action === "approve" ? "approved_manager" : "rejected_manager";
    await leaveRepository.updateStatus(requestId, status, managerId, notes);
  },

  /**
   * HR approves/rejects request
   */
  async hrAction(
    requestId: string,
    hrId: string,
    action: "approve" | "reject",
    notes?: string
  ): Promise<void> {
    const request = await leaveRepository.findRequestById(requestId);
    if (!request) throw new Error("Request not found");

    const status: LeaveStatus =
      action === "approve" ? "approved_hr" : "rejected_hr";
    await leaveRepository.updateStatus(requestId, status, hrId, notes);

    // If fully approved, update balance and sync attendance
    if (action === "approve") {
      // Update leave balance
      if (request.leave_type === "annual" || request.leave_type === "sick") {
        await leaveRepository.updateBalanceUsed(
          request.employee_id,
          request.leave_type,
          request.total_days
        );
      }

      // Sync attendance records
      const { attendanceRepository } = await import(
        "@/repositories/attendance.repository"
      );
      await attendanceRepository.createLeaveRecords(
        request.employee_id,
        request.id,
        request.start_date,
        request.end_date
      );
    }
  },

  /**
   * Get leave balance for user
   */
  async getBalance(userId: string): Promise<LeaveBalance> {
    return leaveRepository.getOrCreateBalance(userId);
  },

  /**
   * Calculate remaining leave days
   */
  async getRemainingDays(
    userId: string,
    leaveType: LeaveType
  ): Promise<number> {
    const balance = await this.getBalance(userId);

    if (leaveType === "annual") {
      return balance.annual_total - balance.annual_used;
    } else if (leaveType === "sick") {
      return balance.sick_total - balance.sick_used;
    }

    return 0; // Other types don't have limits
  },

  calculateWorkingDays,
};
