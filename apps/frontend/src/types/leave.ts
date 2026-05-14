// Leave type and status enums matching database
export const LEAVE_TYPES = {
  annual: "Cuti Tahunan",
  sick: "Cuti Sakit",
  maternity: "Cuti Melahirkan",
  special: "Cuti Khusus",
} as const;

export type LeaveType = keyof typeof LEAVE_TYPES;

export const LEAVE_STATUSES = {
  draft: "Draft",
  submitted: "Diajukan",
  approved_manager: "Disetujui Manager",
  rejected_manager: "Ditolak Manager",
  approved_hr: "Disetujui HR",
  rejected_hr: "Ditolak HR",
} as const;

export type LeaveStatus = keyof typeof LEAVE_STATUSES;

export const LEAVE_STATUS_COLORS: Record<LeaveStatus, string> = {
  draft: "bg-gray-100 text-gray-800",
  submitted: "bg-blue-100 text-blue-800",
  approved_manager: "bg-yellow-100 text-yellow-800",
  rejected_manager: "bg-red-100 text-red-800",
  approved_hr: "bg-green-100 text-green-800",
  rejected_hr: "bg-red-100 text-red-800",
};

export type LeaveRequest = {
  id: string;
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string | null;
  status: LeaveStatus;
  manager_id: string | null;
  manager_notes: string | null;
  manager_action_at: string | null;
  hr_id: string | null;
  hr_notes: string | null;
  hr_action_at: string | null;
  policy_check_result: {
    eligible: boolean;
    message: string;
    balance_before: number;
    balance_after: number;
  } | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  employee?: { full_name: string; email: string };
};

export type LeaveBalance = {
  id: string;
  user_id: string;
  annual_total: number;
  annual_used: number;
  sick_total: number;
  sick_used: number;
  year: number;
};

export type CreateLeaveRequestInput = {
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason?: string;
};
