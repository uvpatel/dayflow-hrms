import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leaveRequests } from "@/db/schema";
import { eq } from "drizzle-orm";

type RouteParams = {
  params: Promise<{ requestId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { requestId } = await params;
    const id = Number(requestId);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid leave request ID" },
        { status: 400 }
      );
    }

    const [item] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, id));

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Leave request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Leave request ${id} fetched successfully`,
      data: item,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch leave request" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { requestId } = await params;
    const id = Number(requestId);
    const body = await request.json();

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid leave request ID" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(leaveRequests)
      .set({
        ...(body.employeeId !== undefined && { employeeId: Number(body.employeeId) }),
        leaveType: body.leaveType,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        reason: body.reason ?? null,
        status: body.status ?? "pending",
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Leave request not found" },
        { status: 404 }
      );
    }

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

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { requestId } = await params;
    const id = Number(requestId);
    const body = await request.json();

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid leave request ID" },
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

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Leave request not found" },
        { status: 404 }
      );
    }

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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { requestId } = await params;
    const id = Number(requestId);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid leave request ID" },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(leaveRequests)
      .where(eq(leaveRequests.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Leave request not found" },
        { status: 404 }
      );
    }

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
