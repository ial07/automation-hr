// Overtime status matching database
export const OVERTIME_STATUS = {
  submitted: "Diajukan",
  approved_manager: "Disetujui Manager",
  rejected_manager: "Ditolak Manager",
  approved_hr: "Disetujui HR",
  rejected_hr: "Ditolak HR",
} as const;

export type OvertimeStatus = keyof typeof OVERTIME_STATUS;

export const OVERTIME_COLORS: Record<OvertimeStatus, string> = {
  submitted: "bg-blue-100 text-blue-800",
  approved_manager: "bg-yellow-100 text-yellow-800",
  rejected_manager: "bg-red-100 text-red-800",
  approved_hr: "bg-green-100 text-green-800",
  rejected_hr: "bg-red-100 text-red-800",
};

export type OvertimeRequest = {
  id: string;
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  hours: number;
  reason: string;
  status: OvertimeStatus;
  attendance_record_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  employee?: { full_name: string; email: string };
};

export type CreateOvertimeInput = {
  date: string;
  start_time: string;
  end_time: string;
  reason: string;
};
