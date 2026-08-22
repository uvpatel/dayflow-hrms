import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-context";
import { db } from "@/db";
import { payrollPeriods } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { error, ctx } = await requireAuth(request.headers);
  if (error || !ctx) return error!;

  try {
    const whereClause = ctx.organizationId ? eq(payrollPeriods.organizationId, ctx.organizationId) : undefined;
    const data = await db.select().from(payrollPeriods).where(whereClause).orderBy(desc(payrollPeriods.createdAt));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error("Error fetching payroll periods:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch payroll periods" }, { status: 500 });
  }
}
