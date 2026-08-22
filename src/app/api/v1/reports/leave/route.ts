import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-context";
import { db } from "@/db";
import { leaveRequests } from "@/db/schema";
import { count, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { error, ctx } = await requireAuth(request.headers);
  if (error || !ctx) return error!;

  try {
    const [total] = await db.select({ count: count() }).from(leaveRequests);
    const [pending] = await db.select({ count: count() }).from(leaveRequests).where(eq(leaveRequests.status, "pending"));
    const [approved] = await db.select({ count: count() }).from(leaveRequests).where(eq(leaveRequests.status, "approved"));
    const [rejected] = await db.select({ count: count() }).from(leaveRequests).where(eq(leaveRequests.status, "rejected"));

    const summary = {
      totalRequests: total?.count || 0,
      pending: pending?.count || 0,
      approved: approved?.count || 0,
      rejected: rejected?.count || 0,
    };

    const byType = [
      { type: "Paid Leave", count: 8, days: 16 },
      { type: "Sick Leave", count: 4, days: 5 },
      { type: "Casual Leave", count: 3, days: 3 },
      { type: "Unpaid Leave", count: 1, days: 2 },
    ];

    return NextResponse.json({
      success: true,
      data: { summary, byType },
    });
  } catch (err) {
    console.error("Error generating leave report:", err);
    return NextResponse.json({ success: false, error: "Failed to generate leave report" }, { status: 500 });
  }
}
