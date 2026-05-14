import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function validateData() {
  try {
    console.log("Validating data...");
    
    const users = await prisma.user.count();
    const leaveBalances = await prisma.leaveBalance.count();
    const leaveRequests = await prisma.leaveRequest.count();
    const attendance = await prisma.attendanceRecord.count();
    const overtime = await prisma.overtimeRecord.count();
    const chatLogs = await prisma.chatLog.count();
    const documents = await prisma.documentChunk.count();

    console.log(`Users: ${users}`);
    console.log(`Leave Balances: ${leaveBalances}`);
    console.log(`Leave Requests: ${leaveRequests}`);
    console.log(`Attendance Records: ${attendance}`);
    console.log(`Overtime Records: ${overtime}`);
    console.log(`Chat Logs: ${chatLogs}`);
    console.log(`Document Chunks: ${documents}`);

    // Sample queries
    const sampleAttendance = await prisma.attendanceRecord.findFirst({ include: { user: true } });
    console.log("Sample Attendance:", sampleAttendance?.status, "User:", sampleAttendance?.user.email);

    const sampleLeave = await prisma.leaveBalance.findFirst({ include: { user: true } });
    console.log("Sample Leave Balance:", sampleLeave?.annual_used, "User:", sampleLeave?.user.email);

    const sampleOvertime = await prisma.overtimeRecord.findFirst();
    console.log("Sample Overtime Hours:", sampleOvertime?.hours);

    const sampleDoc = await prisma.$queryRaw`SELECT content, token_count, embedding::text FROM document_chunks LIMIT 1`;
    console.log("Sample Document parsed correctly!", sampleDoc ? 'Yes' : 'No');

    console.log("Validation complete! Data is consistent.");
  } catch (error) {
    console.error("Validation failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

validateData();
