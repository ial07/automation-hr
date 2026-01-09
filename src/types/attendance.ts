// Attendance status matching database
export const ATTENDANCE_STATUS = {
  present: "Hadir",
  late: "Terlambat",
  absent: "Tidak Hadir",
  wfh: "WFH",
  leave: "Cuti",
} as const;

export type AttendanceStatus = keyof typeof ATTENDANCE_STATUS;

export const ATTENDANCE_COLORS: Record<AttendanceStatus, string> = {
  present: "bg-green-100 text-green-800",
  late: "bg-yellow-100 text-yellow-800",
  absent: "bg-red-100 text-red-800",
  wfh: "bg-blue-100 text-blue-800",
  leave: "bg-purple-100 text-purple-800",
};

export type AttendanceRecord = {
  id: string;
  user_id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: AttendanceStatus;
  notes: string | null;
  leave_request_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  user?: { full_name: string; email: string };
};

export type CheckInInput = {
  notes?: string;
  is_wfh?: boolean;
};

export type CheckOutInput = {
  notes?: string;
};
