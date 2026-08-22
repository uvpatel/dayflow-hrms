import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth-context";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { and, desc, eq, ilike, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { error, ctx } = await requireAuth(request.headers);
  if (error || !ctx) return error!;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit") ?? 50)));
    const offset = (page - 1) * limit;

    const orgCondition = ctx.organizationId ? eq(employees.organizationId, ctx.organizationId) : undefined;

    const searchCondition = search
      ? or(
          ilike(employees.firstName, `%${search}%`),
          ilike(employees.lastName, `%${search}%`),
          ilike(employees.email, `%${search}%`),
          ilike(employees.phoneNumber, `%${search}%`),
          ilike(employees.employeeNumber, `%${search}%`)
        )
      : undefined;

    const whereClause = orgCondition && searchCondition
      ? and(orgCondition, searchCondition)
      : orgCondition || searchCondition || undefined;

    const data = await db
      .select()
      .from(employees)
      .where(whereClause)
      .orderBy(desc(employees.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      message: "Employees fetched successfully",
      data,
      meta: { page, limit, count: data.length, search },
    });
  } catch (err) {
    console.error("Error fetching employees:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { error, ctx } = await requirePermission("employee:create", request.headers);
  if (error || !ctx) return error!;

  try {
    const body = await request.json();

    if (!body.firstName || !body.lastName || !body.email) {
      return NextResponse.json(
        { success: false, error: "First name, last name, and email are required" },
        { status: 400 }
      );
    }

    const assignedRole = ["admin", "hr", "manager", "employee"].includes(body.role)
      ? body.role
      : "employee";

    // Prevent non-admins from creating admin accounts
    if (assignedRole === "admin" && ctx.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Only administrators can create admin employees" },
        { status: 403 }
      );
    }

    const [created] = await db
      .insert(employees)
      .values({
        organizationId: ctx.organizationId,
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        email: body.email.trim().toLowerCase(),
        phoneNumber: body.phoneNumber?.trim() || null,
        departmentId: body.departmentId ? Number(body.departmentId) : null,
        designationId: body.designationId ? Number(body.designationId) : null,
        locationId: body.locationId ? Number(body.locationId) : null,
        managerId: body.managerId ? Number(body.managerId) : null,
        employeeNumber: body.employeeNumber?.trim() || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        role: assignedRole,
        employmentStatus: body.employmentStatus || "active",
        employmentType: body.employmentType || "full_time",
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "Employee created successfully",
        data: created,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating employee:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create employee" },
      { status: 500 }
    );
  }
}
