import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/jwt";
import { leaveService } from "@/services/leave.service";

// GET - Get user's leave balance
export async function GET() {
  const session = await getSessionFromCookie();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const balance = await leaveService.getBalance(session.userId);

    return NextResponse.json({
      balance,
      remaining: {
        annual: balance.annual_total - balance.annual_used,
        sick: balance.sick_total - balance.sick_used,
      },
    });
  } catch (error) {
    console.error("Get balance error:", error);
    return NextResponse.json(
      { error: "Failed to get balance" },
      { status: 500 }
    );
  }
}
