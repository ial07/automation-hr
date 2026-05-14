import { PrismaClient, UserRole, LeaveType, LeaveStatus, AttendanceStatus, OvertimeStatus } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log("Starting database seed...");

  try {
    // 1. Users
    const hr = await prisma.user.create({
      data: {
        email: 'hr@company.com',
        password_hash: '$2a$10$dummyHashHereSoItWorks', // dummy bcrypt hash
        full_name: 'Sarah (HR Manager)',
        role: UserRole.hr,
      }
    });

    const manager = await prisma.user.create({
      data: {
        email: 'manager@company.com',
        password_hash: '$2a$10$dummyHashHereSoItWorks',
        full_name: 'Michael (Engineering Manager)',
        role: UserRole.manager,
      }
    });

    const employee = await prisma.user.create({
      data: {
        email: 'employee@company.com',
        password_hash: '$2a$10$dummyHashHereSoItWorks',
        full_name: 'John Doe',
        role: UserRole.employee,
        manager_id: manager.id
      }
    });
    console.log("Created users.");

    // 2. Leave Balances
    await prisma.leaveBalance.createMany({
      data: [
        { user_id: hr.id, annual_total: 12, annual_used: 2, sick_total: 14, sick_used: 0, year: 2026 },
        { user_id: manager.id, annual_total: 12, annual_used: 5, sick_total: 14, sick_used: 1, year: 2026 },
        { user_id: employee.id, annual_total: 12, annual_used: 0, sick_total: 14, sick_used: 2, year: 2026 },
      ]
    });
    console.log("Created leave_balances.");

    // 3. Leave Requests
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employee_id: employee.id,
        leave_type: LeaveType.annual,
        start_date: new Date('2026-06-01'),
        end_date: new Date('2026-06-03'),
        total_days: 3,
        reason: 'Family vacation',
        status: LeaveStatus.approved_manager,
        manager_id: manager.id,
        manager_notes: 'Approved, enjoy your trip!',
        manager_action_at: new Date()
      }
    });
    console.log("Created leave_requests.");

    // 4. Attendance Records
    await prisma.attendanceRecord.createMany({
      data: [
        {
          user_id: employee.id,
          date: new Date('2026-05-10'),
          check_in_time: new Date('2026-05-10T09:00:00Z'),
          check_out_time: new Date('2026-05-10T17:00:00Z'),
          status: AttendanceStatus.present,
        },
        {
          user_id: employee.id,
          date: new Date('2026-05-11'),
          check_in_time: new Date('2026-05-11T09:30:00Z'), // Late
          check_out_time: new Date('2026-05-11T17:30:00Z'),
          status: AttendanceStatus.late,
          notes: 'Traffic'
        },
        // Tied to the leave request
        {
          user_id: employee.id,
          date: new Date('2026-06-01'),
          status: AttendanceStatus.leave,
          leave_request_id: leaveRequest.id
        }
      ]
    });
    console.log("Created attendance_records.");

    // 5. Overtime Records
    await prisma.overtimeRecord.create({
      data: {
        employee_id: employee.id,
        date: new Date('2026-05-10'),
        start_time: new Date('2026-05-10T17:00:00Z'),
        end_time: new Date('2026-05-10T19:00:00Z'),
        hours: 2.0,
        reason: 'Project release deployment',
        status: OvertimeStatus.approved_manager,
        approved_by: manager.id,
        approved_at: new Date()
      }
    });
    console.log("Created overtime_records.");

    // 6. Chat Logs
    await prisma.chatLog.create({
      data: {
        user_id: employee.id,
        question: 'Berapa sisa cuti tahunan saya?',
        answer: 'Berdasarkan data sistem, sisa cuti tahunan Anda adalah 12 hari.',
        processing_time_ms: 1250,
      }
    });
    console.log("Created chat_logs.");

    // 7. Document Chunks (with 1536 dim vector)
    // Create a dummy vector of length 1536
    const dummyVector = Array(1536).fill(0.01);
    const vectorStr = JSON.stringify(dummyVector);

    await prisma.$executeRawUnsafe(`
      INSERT INTO document_chunks (content, token_count, embedding) 
      VALUES ('Kebijakan Cuti Tahunan: Setiap karyawan berhak mendapatkan 12 hari cuti tahunan.', 14, '${vectorStr}')
    `);
    console.log("Created document_chunks with embeddings.");

    console.log("Seed completed successfully!");

  } catch (error) {
    console.error("Seed error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
