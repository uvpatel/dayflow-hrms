import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendances } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

type RouteParams = {
  params: Promise<{ employeeId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { employeeId } = await params;
    const data = await db
      .select()
      .from(attendances)
      .where(eq(attendances.userId, employeeId))
      .orderBy(desc(attendances.date));

    return NextResponse.json({
      success: true,
      message: `Attendance records for employee ${employeeId} fetched successfully`,
      data,
      meta: { employeeId, count: data.length },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch employee attendance records" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { employeeId } = await params;
    const body = await request.json();

    const [created] = await db
      .insert(attendances)
      .values({
        userId: employeeId,
        date: body.date ? new Date(body.date) : new Date(),
        checkInTime: body.checkInTime ? new Date(body.checkInTime) : null,
        checkOutTime: body.checkOutTime ? new Date(body.checkOutTime) : null,
        status: body.status ?? "present",
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: `Attendance record created for employee ${employeeId}`,
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to log employee attendance" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { employeeId } = await params;
    const body = await request.json();
    const id = body.id ? Number(body.id) : undefined;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Attendance record ID is required in body" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(attendances)
      .set({
        userId: employeeId,
        date: body.date ? new Date(body.date) : new Date(),
        checkInTime: body.checkInTime ? new Date(body.checkInTime) : null,
        checkOutTime: body.checkOutTime ? new Date(body.checkOutTime) : null,
        status: body.status ?? "present",
        updatedAt: new Date(),
      })
      .where(eq(attendances.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      message: `Attendance record ${id} replaced successfully`,
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to replace attendance record" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { employeeId } = await params;
    const body = await request.json();
    const id = body.id ? Number(body.id) : undefined;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Attendance record ID is required in body" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(attendances)
      .set({
        ...(body.date !== undefined && { date: new Date(body.date) }),
        ...(body.checkInTime !== undefined && { checkInTime: body.checkInTime ? new Date(body.checkInTime) : null }),
        ...(body.checkOutTime !== undefined && { checkOutTime: body.checkOutTime ? new Date(body.checkOutTime) : null }),
        ...(body.status !== undefined && { status: body.status }),
        updatedAt: new Date(),
      })
      .where(eq(attendances.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      message: `Attendance record ${id} updated successfully`,
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update attendance record" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { employeeId } = await params;
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");

    if (idParam) {
      const id = Number(idParam);
      const [deleted] = await db
        .delete(attendances)
        .where(eq(attendances.id, id))
        .returning();

      return NextResponse.json({
        success: true,
        message: `Attendance record ${id} deleted successfully`,
        data: deleted,
      });
    }

    const deleted = await db
      .delete(attendances)
      .where(eq(attendances.userId, employeeId))
      .returning();

    return NextResponse.json({
      success: true,
      message: `All attendance records for employee ${employeeId} deleted successfully`,
      data: deleted,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete attendance records" },
      { status: 500 }
    );
  }
}
