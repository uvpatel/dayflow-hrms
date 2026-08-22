import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { workSchedules } from "@/db/schema";
import { eq } from "drizzle-orm";

type RouteParams = {
  params: Promise<{ scheduleId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { scheduleId } = await params;
    const id = Number(scheduleId);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid work schedule ID" },
        { status: 400 }
      );
    }

    const [item] = await db
      .select()
      .from(workSchedules)
      .where(eq(workSchedules.id, id));

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Work schedule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Work schedule ${id} fetched successfully`,
      data: item,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch work schedule" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { scheduleId } = await params;
    const id = Number(scheduleId);
    const body = await request.json();

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid work schedule ID" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(workSchedules)
      .set({
        ...(body.employeeId !== undefined && { employeeId: Number(body.employeeId) }),
        scheduleName: body.scheduleName,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : null,
        updatedAt: new Date(),
      })
      .where(eq(workSchedules.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Work schedule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Work schedule ${id} replaced successfully`,
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to replace work schedule" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { scheduleId } = await params;
    const id = Number(scheduleId);
    const body = await request.json();

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid work schedule ID" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(workSchedules)
      .set({
        ...(body.employeeId !== undefined && { employeeId: Number(body.employeeId) }),
        ...(body.scheduleName !== undefined && { scheduleName: body.scheduleName }),
        ...(body.startDate !== undefined && { startDate: new Date(body.startDate) }),
        ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
        updatedAt: new Date(),
      })
      .where(eq(workSchedules.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Work schedule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Work schedule ${id} updated successfully`,
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update work schedule" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { scheduleId } = await params;
    const id = Number(scheduleId);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid work schedule ID" },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(workSchedules)
      .where(eq(workSchedules.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Work schedule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Work schedule ${id} deleted successfully`,
      data: deleted,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete work schedule" },
      { status: 500 }
    );
  }
}
