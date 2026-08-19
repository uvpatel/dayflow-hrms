import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leaveRequests } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

type RouteParams = {
  params: Promise<{ employeeId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { employeeId } = await params;
    const empId = Number(employeeId);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    if (isNaN(empId)) {
      return NextResponse.json(
        { success: false, error: "Invalid employee ID" },
        { status: 400 }
      );
    }

    const whereClause = status
      ? and(eq(leaveRequests.employeeId, empId), eq(leaveRequests.status, status))
      : eq(leaveRequests.employeeId, empId);

    const data = await db
      .select()
      .from(leaveRequests)
      .where(whereClause)
      .orderBy(desc(leaveRequests.createdAt));

    return NextResponse.json({
      success: true,
      message: `Time-off records for employee ${empId} fetched successfully`,
      data,
      meta: { employeeId: empId, count: data.length, status },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch employee time-off records" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { employeeId } = await params;
    const empId = Number(employeeId);
    const body = await request.json();

    if (isNaN(empId)) {
      return NextResponse.json(
        { success: false, error: "Invalid employee ID" },
        { status: 400 }
      );
    }

    if (!body.leaveType || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { success: false, error: "Leave type, start date, and end date are required" },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(leaveRequests)
      .values({
        employeeId: empId,
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
        message: `Time-off request created for employee ${empId}`,
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to submit employee time-off request" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { employeeId } = await params;
    const empId = Number(employeeId);
    const body = await request.json();
    const id = Number(body.id);

    if (isNaN(id) || isNaN(empId)) {
      return NextResponse.json(
        { success: false, error: "Valid request ID and employee ID are required" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(leaveRequests)
      .set({
        employeeId: empId,
        leaveType: body.leaveType,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        reason: body.reason ?? null,
        status: body.status ?? "pending",
        updatedAt: new Date(),
      })
      .where(and(eq(leaveRequests.id, id), eq(leaveRequests.employeeId, empId)))
      .returning();

    return NextResponse.json({
      success: true,
      message: `Time-off request ${id} replaced successfully`,
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to replace time-off request" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { employeeId } = await params;
    const empId = Number(employeeId);
    const body = await request.json();
    const id = Number(body.id);

    if (isNaN(id) || isNaN(empId)) {
      return NextResponse.json(
        { success: false, error: "Valid request ID and employee ID are required" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(leaveRequests)
      .set({
        ...(body.leaveType !== undefined && { leaveType: body.leaveType }),
        ...(body.startDate !== undefined && { startDate: new Date(body.startDate) }),
        ...(body.endDate !== undefined && { endDate: new Date(body.endDate) }),
        ...(body.reason !== undefined && { reason: body.reason }),
        ...(body.status !== undefined && { status: body.status }),
        updatedAt: new Date(),
      })
      .where(and(eq(leaveRequests.id, id), eq(leaveRequests.employeeId, empId)))
      .returning();

    return NextResponse.json({
      success: true,
      message: `Time-off request ${id} updated successfully`,
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update time-off request" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { employeeId } = await params;
    const empId = Number(employeeId);
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (isNaN(id) || isNaN(empId)) {
      return NextResponse.json(
        { success: false, error: "Valid request ID is required in query params" },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(leaveRequests)
      .where(and(eq(leaveRequests.id, id), eq(leaveRequests.employeeId, empId)))
      .returning();

    return NextResponse.json({
      success: true,
      message: `Time-off request ${id} deleted successfully`,
      data: deleted,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete time-off request" },
      { status: 500 }
    );
  }
}
