/**
 * MVP Seed Script
 * Run with: npx tsx scripts/seed-users.ts
 */

import "dotenv/config";
import { createAdminClient } from "../src/lib/supabase/admin";
import bcrypt from "bcryptjs";

const supabase = createAdminClient();

const SEED_PASSWORD = "admin123";

interface SeedUser {
  email: string;
  full_name: string;
  role: "owner" | "hr" | "manager" | "employee";
  reportsTo?: string; // email of manager
}

const seedUsers: SeedUser[] = [
  // Core users (reporting: Employee → Manager → HR → Owner)
  { email: "owner@gmail.com", full_name: "Owner", role: "owner" },
  {
    email: "hr1@gmail.com",
    full_name: "HR 1",
    role: "hr",
    reportsTo: "owner@gmail.com",
  },
  {
    email: "employee1@gmail.com",
    full_name: "Employee 1",
    role: "employee",
    reportsTo: "manager1@gmail.com",
  },
  {
    email: "employee2@gmail.com",
    full_name: "Employee 2",
    role: "employee",
    reportsTo: "manager1@gmail.com",
  },

  // QA test users
  {
    email: "employee.late@gmail.com",
    full_name: "Test Late Employee",
    role: "employee",
    reportsTo: "manager1@gmail.com",
  },
  {
    email: "employee.leave@gmail.com",
    full_name: "Test Heavy Leave",
    role: "employee",
    reportsTo: "manager1@gmail.com",
  },
];

// Manager 1 (existing) reports to HR 1 - will be set separately
const managerReportsTo = {
  email: "manager1@gmail.com",
  reportsTo: "hr1@gmail.com",
};

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function seedUsersAndBalances() {
  console.log("🌱 Starting seed...\n");

  const passwordHash = await hashPassword(SEED_PASSWORD);
  const userIdMap: Record<string, string> = {};

  // First pass: Create users
  for (const user of seedUsers) {
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", user.email)
      .single();

    if (existing) {
      console.log(`⏭️  User ${user.email} already exists`);
      userIdMap[user.email] = existing.id;
      continue;
    }

    const { data, error } = await supabase
      .from("users")
      .insert({
        email: user.email,
        password_hash: passwordHash,
        full_name: user.full_name,
        role: user.role,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`❌ Failed to create ${user.email}:`, error.message);
      continue;
    }

    console.log(`✅ Created user: ${user.email} (${user.role})`);
    userIdMap[user.email] = data.id;
  }

  // Fetch existing users for manager reference
  const { data: allUsers } = await supabase.from("users").select("id, email");
  allUsers?.forEach((u) => {
    userIdMap[u.email] = u.id;
  });

  // Second pass: Set manager relationships
  for (const user of seedUsers) {
    if (!user.reportsTo || !userIdMap[user.email]) continue;

    const managerId = userIdMap[user.reportsTo];
    if (!managerId) {
      console.log(`⚠️  Manager ${user.reportsTo} not found for ${user.email}`);
      continue;
    }

    await supabase
      .from("users")
      .update({ manager_id: managerId })
      .eq("email", user.email);

    console.log(`🔗 ${user.email} reports to ${user.reportsTo}`);
  }

  // Set Manager 1 reports to HR 1
  if (userIdMap["manager1@gmail.com"] && userIdMap["hr1@gmail.com"]) {
    await supabase
      .from("users")
      .update({ manager_id: userIdMap["hr1@gmail.com"] })
      .eq("email", "manager1@gmail.com");
    console.log("🔗 manager1@gmail.com reports to hr1@gmail.com");
  }

  // Third pass: Initialize leave balances
  const currentYear = new Date().getFullYear();

  for (const user of seedUsers) {
    if (user.role !== "employee") continue;

    const userId = userIdMap[user.email];
    if (!userId) continue;

    const { data: existingBalance } = await supabase
      .from("leave_balances")
      .select("id")
      .eq("user_id", userId)
      .eq("year", currentYear)
      .single();

    if (existingBalance) {
      console.log(`⏭️  Leave balance already exists for ${user.email}`);
      continue;
    }

    await supabase.from("leave_balances").insert({
      user_id: userId,
      year: currentYear,
      annual_total: 12,
      annual_used: 0,
      sick_total: 12,
      sick_used: 0,
    });

    console.log(`📋 Initialized leave balance for ${user.email}: 12 days`);
  }

  console.log("\n✨ Seed complete!");
}

seedUsersAndBalances().catch(console.error);
