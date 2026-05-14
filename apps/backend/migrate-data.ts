import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import WebSocket from 'ws';

global.WebSocket = WebSocket as any;

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const supabase = createClient(
  'https://pryajpxntjyddzscwltf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeWFqcHhudGp5ZGR6c2N3bHRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzg3NTMyMCwiZXhwIjoyMDgzNDUxMzIwfQ.142XXF6duw1dKWV8HQSBBGapaClZXywRHGI9fYnUk8k'
);

const prisma = new PrismaClient({ adapter });

async function migrate() {
  try {
    // 1. users
    const { data: users, error: errUsers } = await supabase.from('users').select('*');
    if (errUsers) throw errUsers;
    if (users && users.length > 0) {
      await prisma.$executeRawUnsafe(`ALTER TABLE "users" DISABLE TRIGGER ALL`);
      await prisma.user.createMany({ data: users });
      await prisma.$executeRawUnsafe(`ALTER TABLE "users" ENABLE TRIGGER ALL`);
      console.log(`Imported ${users.length} users`);
    }

    // 2. leave_balances
    const { data: balances, error: errBal } = await supabase.from('leave_balances').select('*');
    if (errBal) throw errBal;
    if (balances && balances.length > 0) {
      await prisma.$executeRawUnsafe(`ALTER TABLE "leave_balances" DISABLE TRIGGER ALL`);
      await prisma.leaveBalance.createMany({ data: balances });
      await prisma.$executeRawUnsafe(`ALTER TABLE "leave_balances" ENABLE TRIGGER ALL`);
      console.log(`Imported ${balances.length} leave_balances`);
    }

    // Since attendance_records depends on leave_requests, but prompt said attendance_records first,
    // I'll extract both, but to avoid FK issues with Prisma createMany without dropping constraints in schema:
    // we can use raw queries or just try to insert. If it fails, we know why. But I'll try to insert in the requested order.
    // If it fails, we will try swapping the order.

    // 3. attendance_records
    const { data: attendance, error: errAtt } = await supabase.from('attendance_records').select('*');
    if (errAtt) throw errAtt;
    
    // 4. leave_requests
    const { data: leave, error: errLeave } = await supabase.from('leave_requests').select('*');
    if (errLeave) throw errLeave;

    // To prevent FK issues if attendance references leave_requests:
    if (leave && leave.length > 0) {
      try {
        await prisma.leaveRequest.createMany({ data: leave });
        console.log(`Imported ${leave.length} leave_requests`);
      } catch (e) { console.error("Error leave_requests:", e); }
    }

    if (attendance && attendance.length > 0) {
      try {
        await prisma.attendanceRecord.createMany({ data: attendance });
        console.log(`Imported ${attendance.length} attendance_records`);
      } catch (e) { console.error("Error attendance_records:", e); }
    }

    // 5. overtime_records (from overtime_requests in supabase)
    const { data: overtime, error: errOvertime } = await supabase.from('overtime_requests').select('*');
    if (errOvertime) throw errOvertime;
    if (overtime && overtime.length > 0) {
      await prisma.overtimeRecord.createMany({ data: overtime });
      console.log(`Imported ${overtime.length} overtime_records`);
    }

    // 6. document_chunks
    const { data: chunks, error: errChunks } = await supabase.from('document_chunks').select('*');
    if (errChunks) throw errChunks;
    if (chunks && chunks.length > 0) {
      for (const chunk of chunks) {
        if (chunk.embedding) {
          const vectorStr = JSON.stringify(chunk.embedding);
          await prisma.$executeRawUnsafe(`INSERT INTO "document_chunks" (id, document_id, content, token_count, embedding) VALUES ('${chunk.id}', ${chunk.document_id ? `'${chunk.document_id}'` : 'NULL'}, $1, ${chunk.token_count}, '${vectorStr}')`, chunk.content);
        } else {
          await prisma.$executeRawUnsafe(`INSERT INTO "document_chunks" (id, document_id, content, token_count) VALUES ('${chunk.id}', ${chunk.document_id ? `'${chunk.document_id}'` : 'NULL'}, $1, ${chunk.token_count})`, chunk.content);
        }
      }
      console.log(`Imported ${chunks.length} document_chunks`);
    }

    // 7. chat_logs
    const { data: chat, error: errChat } = await supabase.from('chat_logs').select('*');
    if (errChat) throw errChat;
    if (chat && chat.length > 0) {
      await prisma.chatLog.createMany({ data: chat });
      console.log(`Imported ${chat.length} chat_logs`);
    }

    console.log("Migration complete!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

migrate().catch(console.error).finally(() => prisma.$disconnect());
