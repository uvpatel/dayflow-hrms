import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-context";
import { db } from "@/db";
import { payslips, employees } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { error, ctx } = await requireAuth(request.headers);
  if (error || !ctx) return error!;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit") ?? 50)));

    let whereClause = ctx.organizationId ? eq(payslips.organizationId, ctx.organizationId) : undefined;

    // Strict payroll isolation: if regular employee or manager without payroll permission, only see own
    const canViewAll = ctx.role === "admin" || ctx.role === "hr";
    if (!canViewAll) {
      if (!ctx.employee) {
        return NextResponse.json({ success: true, data: [] });
      }
      const selfCondition = eq(payslips.employeeId, ctx.employee.id);
      whereClause = whereClause ? and(whereClause, selfCondition) : selfCondition;
    }

    const data = await db
      .select()
      .from(payslips)
      .where(whereClause)
      .orderBy(desc(payslips.createdAt))
      .limit(limit);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error("Error fetching payslips:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch payslips" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error, ctx } = await requireAuth(request.headers);
  if (error || !ctx) return error!;

  // Strict payroll management permission
  if (ctx.role !== "admin" && ctx.role !== "hr") {
    return NextResponse.json(
      { success: false, error: "Access denied. Only HR and Admins can generate payslips." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const targetEmployeeId = body.employeeId ? Number(body.employeeId) : ctx.employee?.id;

    if (!targetEmployeeId) {
      return NextResponse.json({ success: false, error: "Employee ID is required" }, { status: 400 });
    }

    const [created] = await db
      .insert(payslips)
      .values({
        employeeId: targetEmployeeId,
        organizationId: ctx.organizationId,
        month: body.month || new Date().toLocaleString("default", { month: "long" }),
        year: body.year || new Date().getFullYear(),
        basicSalary: body.basicSalary || "5000",
        netSalary: body.netSalary || "4500",
        status: body.status || "generated",
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "Payslip created successfully",
      data: created,
    }, { status: 201 });
  } catch (err) {
    console.error("Error creating payslip:", err);
    return NextResponse.json({ success: false, error: "Failed to create payslip" }, { status: 500 });
  }
}
