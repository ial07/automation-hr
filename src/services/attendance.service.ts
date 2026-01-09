import { attendanceRepository } from "@/repositories/attendance.repository";
import {
  AttendanceRecord,
  AttendanceStatus,
  CheckInInput,
  CheckOutInput,
} from "@/types/attendance";

// Default fallback (will be overridden by policy documents)
const DEFAULT_START_HOUR = 7;
const DEFAULT_START_MINUTE = 30;

/**
 * Get official work start time from HR policy documents
 */
async function getOfficialStartTime(): Promise<{
  hour: number;
  minute: number;
}> {
  try {
    const { ragService } = await import("@/services/rag.service");
    const { documentChunkRepository } = await import(
      "@/repositories/documentChunk.repository"
    );

    // Search for work hours policy
    const queryEmbedding = await ragService.embedQuery(
      "jam kerja masuk kantor pukul berapa"
    );
    const chunks = await documentChunkRepository.searchSimilar(
      queryEmbedding,
      0.3,
      3
    );

    if (chunks.length > 0) {
      // Look for time patterns like "07:30", "07.30", "pukul 07.30"
      const content = chunks.map((c) => c.content).join(" ");

      // Pattern: Match "pukul XX.XX" or "XX:XX" or "XX.XX"
      const timePattern = /(?:pukul\s*)?(\d{1,2})[:.](\d{2})/gi;
      const match = timePattern.exec(content);

      if (match) {
        const hour = parseInt(match[1], 10);
        const minute = parseInt(match[2], 10);

        // Validate reasonable work start time (5:00 - 10:00)
        if (hour >= 5 && hour <= 10) {
          console.log(
            `[Attendance] Using policy start time: ${hour}:${minute
              .toString()
              .padStart(2, "0")}`
          );
          return { hour, minute };
        }
      }
    }
  } catch (error) {
    console.error("[Attendance] Error fetching policy start time:", error);
  }

  // Fallback to default
  console.log(
    `[Attendance] Using default start time: ${DEFAULT_START_HOUR}:${DEFAULT_START_MINUTE.toString().padStart(
      2,
      "0"
    )}`
  );
  return { hour: DEFAULT_START_HOUR, minute: DEFAULT_START_MINUTE };
}

export const attendanceService = {
  /**
   * Get today's attendance record for a user
   */
  async getTodayStatus(userId: string): Promise<AttendanceRecord | null> {
    return attendanceRepository.getTodayRecord(userId);
  },

  /**
   * Perform check-in
   */
  async checkIn(
    userId: string,
    input: CheckInInput
  ): Promise<AttendanceRecord> {
    // 1. Check if already checked in
    const existing = await attendanceRepository.getTodayRecord(userId);
    if (existing) {
      throw new Error("Anda sudah melakukan check-in hari ini.");
    }

    // 2. Get official start time from policy
    const officialStart = await getOfficialStartTime();

    // 3. Calculate status based on current time vs policy
    const now = new Date();
    const jakartaTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    );

    const hours = jakartaTime.getHours();
    const minutes = jakartaTime.getMinutes();

    let status: AttendanceStatus = "present";

    // Check if Late (current time > policy start time)
    const currentMinutes = hours * 60 + minutes;
    const startMinutes = officialStart.hour * 60 + officialStart.minute;

    if (currentMinutes > startMinutes) {
      status = "late";
    } else if (input.is_wfh) {
      status = "wfh";
    }

    // 4. Save
    return attendanceRepository.createCheckIn(userId, status, input.notes);
  },

  /**
   * Perform check-out
   */
  async checkOut(
    userId: string,
    input: CheckOutInput
  ): Promise<AttendanceRecord> {
    // 1. Get today's record
    const record = await attendanceRepository.getTodayRecord(userId);
    if (!record) {
      throw new Error("Anda belum melakukan check-in hari ini.");
    }

    if (record.check_out_time) {
      throw new Error("Anda sudah melakukan check-out hari ini.");
    }

    // 2. Update
    // Append notes if exist
    let notes = record.notes;
    if (input.notes) {
      notes = notes
        ? `${notes}\n[Checkout] ${input.notes}`
        : `[Checkout] ${input.notes}`;
    }

    return attendanceRepository.updateCheckOut(record.id, notes || undefined);
  },

  /**
   * Get user's attendance history
   */
  async getHistory(userId: string): Promise<AttendanceRecord[]> {
    return attendanceRepository.getHistory(userId);
  },

  /**
   * Get team attendance for today (Manager/HR view)
   */
  async getTeamToday(): Promise<AttendanceRecord[]> {
    return attendanceRepository.getTeamToday();
  },
};
