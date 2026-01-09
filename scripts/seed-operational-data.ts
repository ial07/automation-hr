/**
 * Generate Realistic Operational Data for Last 30 Days
 * Run with: npx tsx scripts/seed-operational-data.ts
 */

import "dotenv/config";
import { createAdminClient } from "../src/lib/supabase/admin";

const supabase = createAdminClient();

// Configuration
const DAYS_BACK = 30;
const WORK_START_HOUR = 7;
const WORK_START_MINUTE = 30;
const WORK_END_HOUR = 17;

// Helper functions
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomTime(
  baseHour: number,
  baseMinute: number,
  maxMinutesOffset: number
): string {
  const offset = randomBetween(0, maxMinutesOffset);
  const totalMinutes = baseHour * 60 + baseMinute + offset;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:00`;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function generateRandomReason(type: "leave" | "overtime"): string {
  const leaveReasons = [
    "Urusan keluarga",
    "Keperluan pribadi",
    "Acara pernikahan keluarga",
    "Pemeriksaan kesehatan rutin",
  ];
  const overtimeReasons = [
    "Deadline project",
    "Menyelesaikan laporan bulanan",
    "Meeting dengan klien luar negeri",
    "Perbaikan bug urgent",
    "Persiapan presentasi",
  ];
  const reasons = type === "leave" ? leaveReasons : overtimeReasons;
  return reasons[randomBetween(0, reasons.length - 1)];
}

async function main() {
  console.log("🌱 Starting operational data generation...\n");

  // Get all employee users
  const { data: users } = await supabase
    .from("users")
    .select("id, email, full_name, role")
    .in("role", ["employee", "manager"]);

  if (!users || users.length === 0) {
    console.log("❌ No employees found");
    return;
  }

  // Get HR user for approvals
  const { data: hrUsers } = await supabase
    .from("users")
    .select("id")
    .eq("role", "hr")
    .limit(1);

  const hrId = hrUsers?.[0]?.id;

  // Get manager for approvals
  const { data: managerUsers } = await supabase
    .from("users")
    .select("id")
    .eq("role", "manager")
    .limit(1);

  const managerId = managerUsers?.[0]?.id;

  const today = new Date();
  const currentYear = today.getFullYear();

  // Generate dates for last 30 days
  const dates: Date[] = [];
  for (let i = DAYS_BACK; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    if (!isWeekend(date)) {
      dates.push(date);
    }
  }

  console.log(`📅 Working days to process: ${dates.length}`);

  for (const user of users) {
    console.log(`\n👤 Processing ${user.full_name} (${user.email})`);

    // Track leave days for this user
    const leaveDays: Set<string> = new Set();

    // Decide random patterns for this user
    const lateCheckInDays = new Set<string>();
    const earlyCheckOutDay = randomBetween(0, dates.length - 1);

    // Pick 1-2 random days for late check-in
    const numLateDays = randomBetween(1, 2);
    while (lateCheckInDays.size < numLateDays) {
      const idx = randomBetween(5, dates.length - 5);
      lateCheckInDays.add(formatDate(dates[idx]));
    }

    // === LEAVE GENERATION ===
    // 1 approved leave (1-2 days) + 1 pending or 1 sick + 1 rejected
    const isEmployeeA =
      user.email.includes("employee1") || user.email.includes("employee.late");

    if (isEmployeeA) {
      // Approved annual leave 1-2 days
      const leaveStartIdx = randomBetween(5, 15);
      const leaveDaysCount = randomBetween(1, 2);
      const leaveStart = formatDate(dates[leaveStartIdx]);
      const leaveEnd = formatDate(
        dates[Math.min(leaveStartIdx + leaveDaysCount - 1, dates.length - 1)]
      );

      for (
        let i = 0;
        i < leaveDaysCount && leaveStartIdx + i < dates.length;
        i++
      ) {
        leaveDays.add(formatDate(dates[leaveStartIdx + i]));
      }

      const { error: leaveError } = await supabase
        .from("leave_requests")
        .insert({
          employee_id: user.id,
          leave_type: "annual",
          start_date: leaveStart,
          end_date: leaveEnd,
          total_days: leaveDaysCount,
          reason: generateRandomReason("leave"),
          status: "approved_hr",
          approved_by: hrId,
          approved_at: new Date(dates[leaveStartIdx - 2]).toISOString(),
        });
      if (!leaveError)
        console.log(
          `  ✅ Created approved annual leave: ${leaveStart} - ${leaveEnd}`
        );

      // Create attendance records as 'leave' for approved leave days
      for (const leaveDay of leaveDays) {
        await supabase.from("attendance_records").upsert(
          {
            user_id: user.id,
            date: leaveDay,
            status: "leave",
          },
          { onConflict: "user_id,date" }
        );
      }

      // Pending leave request
      const pendingIdx = randomBetween(dates.length - 5, dates.length - 1);
      const pendingDate = formatDate(dates[pendingIdx]);
      await supabase.from("leave_requests").insert({
        employee_id: user.id,
        leave_type: "annual",
        start_date: pendingDate,
        end_date: pendingDate,
        total_days: 1,
        reason: "Keperluan mendadak",
        status: "submitted",
      });
      console.log(`  ⏳ Created pending leave: ${pendingDate}`);
    } else {
      // Sick leave + rejected
      const sickIdx = randomBetween(8, 18);
      const sickDate = formatDate(dates[sickIdx]);
      leaveDays.add(sickDate);

      await supabase.from("leave_requests").insert({
        employee_id: user.id,
        leave_type: "sick",
        start_date: sickDate,
        end_date: sickDate,
        total_days: 1,
        reason: "Sakit demam",
        status: "approved_hr",
        approved_by: hrId,
        approved_at: new Date(dates[sickIdx]).toISOString(),
      });
      console.log(`  ✅ Created approved sick leave: ${sickDate}`);

      // Create attendance record as 'leave'
      await supabase.from("attendance_records").upsert(
        {
          user_id: user.id,
          date: sickDate,
          status: "leave",
        },
        { onConflict: "user_id,date" }
      );

      // Rejected leave
      const rejectedIdx = randomBetween(2, 7);
      const rejectedDate = formatDate(dates[rejectedIdx]);
      await supabase.from("leave_requests").insert({
        employee_id: user.id,
        leave_type: "annual",
        start_date: rejectedDate,
        end_date: rejectedDate,
        total_days: 1,
        reason: "Liburan keluarga",
        status: "rejected_hr",
        approved_by: hrId,
        approved_at: new Date(dates[rejectedIdx - 1]).toISOString(),
        notes:
          "Tidak dapat disetujui karena kuota tim sudah penuh pada tanggal tersebut.",
      });
      console.log(`  ❌ Created rejected leave: ${rejectedDate}`);
    }

    // === UPDATE LEAVE BALANCE ===
    const approvedLeaveDaysCount = leaveDays.size;
    if (approvedLeaveDaysCount > 0) {
      const { data: balance } = await supabase
        .from("leave_balances")
        .select("*")
        .eq("user_id", user.id)
        .eq("year", currentYear)
        .single();

      if (balance) {
        await supabase
          .from("leave_balances")
          .update({
            annual_used: balance.annual_used + approvedLeaveDaysCount,
          })
          .eq("id", balance.id);
        console.log(
          `  📋 Updated leave balance: used +${approvedLeaveDaysCount}`
        );
      }
    }

    // === ATTENDANCE GENERATION ===
    for (const date of dates) {
      const dateStr = formatDate(date);

      // Skip if leave day
      if (leaveDays.has(dateStr)) continue;

      // Check if record already exists
      const { data: existing } = await supabase
        .from("attendance_records")
        .select("id")
        .eq("user_id", user.id)
        .eq("date", dateStr)
        .single();

      if (existing) continue;

      // Determine status
      const isLate = lateCheckInDays.has(dateStr);
      const isEarlyOut = dates.indexOf(date) === earlyCheckOutDay;

      // Generate check-in time
      let checkInTime: string;
      if (isLate) {
        // Late: 09:01 to 09:15
        checkInTime = randomTime(9, 1, 14);
      } else {
        // Normal: 07:30 to 08:30
        checkInTime = randomTime(WORK_START_HOUR, WORK_START_MINUTE, 60);
      }

      // Generate check-out time
      let checkOutTime: string;
      if (isEarlyOut) {
        // Early: 16:00 to 16:30
        checkOutTime = randomTime(16, 0, 30);
      } else {
        // Normal: 17:00 to 19:00
        checkOutTime = randomTime(WORK_END_HOUR, 0, 120);
      }

      const status = isLate ? "late" : "present";

      await supabase.from("attendance_records").insert({
        user_id: user.id,
        date: dateStr,
        check_in_time: `${dateStr}T${checkInTime}+07:00`,
        check_out_time: `${dateStr}T${checkOutTime}+07:00`,
        status,
      });
    }
    console.log(
      `  ✅ Generated attendance for ${dates.length - leaveDays.size} days`
    );

    // === OVERTIME GENERATION ===
    const overtimeCount = randomBetween(1, 2);
    const usedOTDays = new Set<string>();

    for (let i = 0; i < overtimeCount; i++) {
      let otIdx: number;
      let otDate: string;

      // Find a day that's not leave and not already used
      do {
        otIdx = randomBetween(5, dates.length - 3);
        otDate = formatDate(dates[otIdx]);
      } while (leaveDays.has(otDate) || usedOTDays.has(otDate));

      usedOTDays.add(otDate);

      const hours = randomBetween(1, 3);
      const startTime = randomTime(WORK_END_HOUR, 30, 30);
      const endHour = WORK_END_HOUR + hours + 1;
      const endTime = `${endHour.toString().padStart(2, "0")}:00:00`;

      // Get attendance record for linking
      const { data: attendanceRecord } = await supabase
        .from("attendance_records")
        .select("id")
        .eq("user_id", user.id)
        .eq("date", otDate)
        .single();

      await supabase.from("overtime_requests").insert({
        employee_id: user.id,
        date: otDate,
        start_time: startTime,
        end_time: endTime,
        hours,
        reason: generateRandomReason("overtime"),
        status: "approved_hr",
        attendance_record_id: attendanceRecord?.id,
        approved_by: hrId,
        approved_at: new Date(dates[otIdx + 1]).toISOString(),
      });
    }
    console.log(`  ⏰ Generated ${overtimeCount} overtime requests`);
  }

  console.log("\n✨ Operational data generation complete!");
}

main().catch(console.error);
