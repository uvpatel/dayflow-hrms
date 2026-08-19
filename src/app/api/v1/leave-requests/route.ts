import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leaveRequests } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.max(1, Number(searchParams.get("limit") ?? 10));
    const offset = (page - 1) * limit;

    const conditions = [];
    if (employeeId) conditions.push(eq(leaveRequests.employeeId, Number(employeeId)));
    if (status) conditions.push(eq(leaveRequests.status, status));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(leaveRequests)
      .where(whereClause)
      .orderBy(desc(leaveRequests.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      message: "Leave requests fetched successfully",
      data,
      meta: { page, limit, count: data.length, employeeId, status },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch leave requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const employeeId = Number(body.employeeId);

    if (isNaN(employeeId) || !body.leaveType || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { success: false, error: "employeeId, leaveType, startDate, and endDate are required" },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(leaveRequests)
      .values({
        employeeId,
        leaveType: body.leaveType,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        reason: body.reason ?? null,
        status: body.status ?? "pending",
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "Leave request created successfully",
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create leave request" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const id = Number(body.id);
    const employeeId = Number(body.employeeId);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Valid leave request ID is required" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(leaveRequests)
      .set({
        employeeId: !isNaN(employeeId) ? employeeId : undefined,
        leaveType: body.leaveType,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        reason: body.reason ?? null,
        status: body.status ?? "pending",
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      message: `Leave request ${id} replaced successfully`,
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to replace leave request" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const id = Number(body.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Valid leave request ID is required" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(leaveRequests)
      .set({
        ...(body.employeeId !== undefined && { employeeId: Number(body.employeeId) }),
        ...(body.leaveType !== undefined && { leaveType: body.leaveType }),
        ...(body.startDate !== undefined && { startDate: new Date(body.startDate) }),
        ...(body.endDate !== undefined && { endDate: new Date(body.endDate) }),
        ...(body.reason !== undefined && { reason: body.reason }),
        ...(body.status !== undefined && { status: body.status }),
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      message: `Leave request ${id} updated successfully`,
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update leave request" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Valid leave request ID is required in query params" },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(leaveRequests)
      .where(eq(leaveRequests.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      message: `Leave request ${id} deleted successfully`,
      data: deleted,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete leave request" },
      { status: 500 }
    );
  }
}
