import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { workSchedules } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");

    const data = await db
      .select()
      .from(workSchedules)
      .where(employeeId ? eq(workSchedules.employeeId, Number(employeeId)) : undefined)
      .orderBy(desc(workSchedules.createdAt));

    return NextResponse.json({
      success: true,
      message: "Work schedules fetched successfully",
      data,
      meta: { count: data.length, employeeId },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch work schedules" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const employeeId = Number(body.employeeId);

    if (isNaN(employeeId) || !body.scheduleName || !body.startDate) {
      return NextResponse.json(
        { success: false, error: "employeeId, scheduleName, and startDate are required" },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(workSchedules)
      .values({
        employeeId,
        scheduleName: body.scheduleName,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "Work schedule created successfully",
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create work schedule" },
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
        { success: false, error: "Valid work schedule ID is required" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(workSchedules)
      .set({
        employeeId: !isNaN(employeeId) ? employeeId : undefined,
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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const id = Number(body.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Valid work schedule ID is required" },
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Valid work schedule ID is required in query params" },
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
