import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testQueries() {
  try {
    console.log("Testing NeonDB connection...");
    const users = await prisma.user.findMany({ include: { attendance_records: true } });
    console.log(`Found ${users.length} users in NeonDB.`);
    console.log("NeonDB connection and queries successful!");
  } catch (error) {
    console.error("Query failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testQueries();
