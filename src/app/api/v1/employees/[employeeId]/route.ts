import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth-context";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { and, eq } from "drizzle-orm";

interface Params {
  params: Promise<{ employeeId: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { error, ctx } = await requireAuth(request.headers);
  if (error || !ctx) return error!;

  const { employeeId } = await params;
  const targetId = Number(employeeId);
  if (isNaN(targetId)) {
    return NextResponse.json({ success: false, error: "Invalid employee ID" }, { status: 400 });
  }

  // Self or privileged access check
  if (ctx.role === "employee" && ctx.employee?.id !== targetId) {
    return NextResponse.json(
      { success: false, error: "Access denied. Employees can only view their own profile." },
      { status: 403 }
    );
  }

  try {
    const orgCondition = ctx.organizationId ? eq(employees.organizationId, ctx.organizationId) : undefined;
    const idCondition = eq(employees.id, targetId);
    const whereClause = orgCondition ? and(idCondition, orgCondition) : idCondition;

    const [employee] = await db.select().from(employees).where(whereClause).limit(1);

    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: employee,
    });
  } catch (err) {
    console.error("Error fetching employee:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch employee" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { error, ctx } = await requireAuth(request.headers);
  if (error || !ctx) return error!;

  const { employeeId } = await params;
  const targetId = Number(employeeId);
  if (isNaN(targetId)) {
    return NextResponse.json({ success: false, error: "Invalid employee ID" }, { status: 400 });
  }

  const isSelf = ctx.employee?.id === targetId;
  const isHR = ctx.role === "hr" || ctx.role === "admin";

  if (!isSelf && !isHR) {
    return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
  }

  try {
    const body = await request.json();

    // Verify existing in organization
    const orgCondition = ctx.organizationId ? eq(employees.organizationId, ctx.organizationId) : undefined;
    const idCondition = eq(employees.id, targetId);
    const whereClause = orgCondition ? and(idCondition, orgCondition) : idCondition;

    const [existing] = await db.select().from(employees).where(whereClause).limit(1);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Employee not found in organization" }, { status: 404 });
    }

    const updateData: Record<string, string | number | Date | null> = {
      updatedAt: new Date(),
    };

    // Self permitted fields: Phone number, basic info if allowed
    if (body.phoneNumber !== undefined) updateData.phoneNumber = body.phoneNumber;

    // HR/Admin permitted fields
    if (isHR) {
      if (body.firstName) updateData.firstName = String(body.firstName).trim();
      if (body.lastName) updateData.lastName = String(body.lastName).trim();
      if (body.departmentId !== undefined) updateData.departmentId = body.departmentId ? Number(body.departmentId) : null;
      if (body.designationId !== undefined) updateData.designationId = body.designationId ? Number(body.designationId) : null;
      if (body.locationId !== undefined) updateData.locationId = body.locationId ? Number(body.locationId) : null;
      if (body.managerId !== undefined) updateData.managerId = body.managerId ? Number(body.managerId) : null;
      if (body.employmentStatus) updateData.employmentStatus = String(body.employmentStatus);
      if (body.employmentType) updateData.employmentType = String(body.employmentType);

      // Role modification check: only admin can promote to admin
      if (body.role && ["admin", "hr", "manager", "employee"].includes(body.role)) {
        if (body.role === "admin" && ctx.role !== "admin") {
          return NextResponse.json({ success: false, error: "Only admins can promote to admin" }, { status: 403 });
        }
        updateData.role = String(body.role);
      }
    }

    const [updated] = await db
      .update(employees)
      .set(updateData)
      .where(whereClause)
      .returning();

    return NextResponse.json({
      success: true,
      message: "Employee updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("Error updating employee:", err);
    return NextResponse.json({ success: false, error: "Failed to update employee" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { error, ctx } = await requirePermission("employee:delete", request.headers);
  if (error || !ctx) return error!;

  const { employeeId } = await params;
  const targetId = Number(employeeId);
  if (isNaN(targetId)) {
    return NextResponse.json({ success: false, error: "Invalid employee ID" }, { status: 400 });
  }

  try {
    const orgCondition = ctx.organizationId ? eq(employees.organizationId, ctx.organizationId) : undefined;
    const idCondition = eq(employees.id, targetId);
    const whereClause = orgCondition ? and(idCondition, orgCondition) : idCondition;

    // Soft delete / archive
    const [archived] = await db
      .update(employees)
      .set({
        employmentStatus: "inactive",
        updatedAt: new Date(),
      })
      .where(whereClause)
      .returning();

    if (!archived) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Employee deactivated successfully",
      data: archived,
    });
  } catch (err) {
    console.error("Error deactivating employee:", err);
    return NextResponse.json({ success: false, error: "Failed to deactivate employee" }, { status: 500 });
  }
}
