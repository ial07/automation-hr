import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/jwt";
import { hasMinimumRole } from "@/lib/auth/roles";
import { intelligenceService } from "@/services/intelligence.service";

// GET - Get comprehensive HR insights
export async function GET() {
  const session = await getSessionFromCookie();

  if (!session || !hasMinimumRole(session.role, "hr")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const insights = await intelligenceService.getComprehensiveInsights();
    return NextResponse.json(insights);
  } catch (error) {
    console.error("Get insights error:", error);
    return NextResponse.json(
      { error: "Failed to get insights" },
      { status: 500 }
    );
  }
}
