import { overtimeRepository } from "@/repositories/overtime.repository";
import { attendanceRepository } from "@/repositories/attendance.repository";
import { auditRepository } from "@/repositories/audit.repository";
import {
  OvertimeRequest,
  OvertimeStatus,
  CreateOvertimeInput,
} from "@/types/overtime";

/**
 * Calculate hours between two time strings (HH:MM)
 */
function calculateHours(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  return Math.max(0, (endMinutes - startMinutes) / 60);
}

export const overtimeService = {
  /**
   * Submit overtime request with attendance validation
   */
  async submitRequest(
    employeeId: string,
    input: CreateOvertimeInput
  ): Promise<OvertimeRequest> {
    // 1. Check if attendance exists for that date
    const { data: attendanceRecords } = await attendanceRepository
      .getHistory(employeeId, 60)
      .then((records) => ({
        data: records.filter((r) => r.date === input.date),
      }));

    const attendance = attendanceRecords[0];

    if (!attendance) {
      throw new Error(
        "Tidak ada data kehadiran untuk tanggal tersebut. Anda harus check-in terlebih dahulu."
      );
    }

    if (!attendance.check_out_time) {
      throw new Error(
        "Anda harus check-out terlebih dahulu sebelum mengajukan lembur."
      );
    }

    // 2. Calculate hours
    const hours = calculateHours(input.start_time, input.end_time);

    if (hours <= 0) {
      throw new Error(
        "Waktu lembur tidak valid. Pastikan waktu selesai setelah waktu mulai."
      );
    }

    if (hours > 8) {
      throw new Error("Lembur maksimal 8 jam per hari.");
    }

    // 3. Create request
    const request = await overtimeRepository.create(employeeId, {
      ...input,
      hours,
      attendance_record_id: attendance.id,
    });

    // 4. Audit log
    await auditRepository.log({
      userId: employeeId,
      action: "create",
      entityType: "overtime_request",
      entityId: request.id,
      newValue: request,
    });

    return request;
  },

  async getEmployeeRequests(employeeId: string): Promise<OvertimeRequest[]> {
    return overtimeRepository.findByEmployee(employeeId);
  },

  async getPendingForManager(): Promise<OvertimeRequest[]> {
    return overtimeRepository.findPendingForManager();
  },

  async getPendingForHR(): Promise<OvertimeRequest[]> {
    return overtimeRepository.findPendingForHR();
  },

  async managerAction(
    requestId: string,
    managerId: string,
    action: "approve" | "reject",
    notes?: string
  ): Promise<void> {
    const status: OvertimeStatus =
      action === "approve" ? "approved_manager" : "rejected_manager";

    await overtimeRepository.updateStatus(requestId, status, managerId, notes);

    await auditRepository.log({
      userId: managerId,
      action: action === "approve" ? "approve" : "reject",
      entityType: "overtime_request",
      entityId: requestId,
      metadata: { role: "manager", notes },
    });
  },

  async hrAction(
    requestId: string,
    hrId: string,
    action: "approve" | "reject",
    notes?: string
  ): Promise<void> {
    const status: OvertimeStatus =
      action === "approve" ? "approved_hr" : "rejected_hr";

    await overtimeRepository.updateStatus(requestId, status, hrId, notes);

    await auditRepository.log({
      userId: hrId,
      action: action === "approve" ? "approve" : "reject",
      entityType: "overtime_request",
      entityId: requestId,
      metadata: { role: "hr", notes },
    });
  },

  async getMonthlyTotal(employeeId: string): Promise<number> {
    return overtimeRepository.getMonthlyTotal(employeeId);
  },
};
