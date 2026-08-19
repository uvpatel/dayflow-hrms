import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendances } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.max(1, Number(searchParams.get("limit") ?? 10));
    const offset = (page - 1) * limit;

    const conditions = [];
    if (userId) conditions.push(eq(attendances.userId, userId));
    if (status) conditions.push(eq(attendances.status, status));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(attendances)
      .where(whereClause)
      .orderBy(desc(attendances.date))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      message: "Attendance records fetched successfully",
      data,
      meta: { page, limit, count: data.length, userId, status },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch attendance records" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(attendances)
      .values({
        userId: body.userId,
        date: body.date ? new Date(body.date) : new Date(),
        checkInTime: body.checkInTime ? new Date(body.checkInTime) : null,
        checkOutTime: body.checkOutTime ? new Date(body.checkOutTime) : null,
        status: body.status ?? "present",
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "Attendance record created successfully",
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create attendance record" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const id = Number(body.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Attendance ID is required" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(attendances)
      .set({
        userId: body.userId,
        date: body.date ? new Date(body.date) : new Date(),
        checkInTime: body.checkInTime ? new Date(body.checkInTime) : null,
        checkOutTime: body.checkOutTime ? new Date(body.checkOutTime) : null,
        status: body.status ?? "present",
        updatedAt: new Date(),
      })
      .where(eq(attendances.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Attendance record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Attendance ${id} replaced successfully`,
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to replace attendance record" },
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
        { success: false, error: "Attendance ID is required" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(attendances)
      .set({
        ...(body.userId !== undefined && { userId: body.userId }),
        ...(body.date !== undefined && { date: new Date(body.date) }),
        ...(body.checkInTime !== undefined && { checkInTime: body.checkInTime ? new Date(body.checkInTime) : null }),
        ...(body.checkOutTime !== undefined && { checkOutTime: body.checkOutTime ? new Date(body.checkOutTime) : null }),
        ...(body.status !== undefined && { status: body.status }),
        updatedAt: new Date(),
      })
      .where(eq(attendances.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Attendance record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Attendance ${id} updated successfully`,
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update attendance record" },
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
        { success: false, error: "Attendance ID is required in query params" },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(attendances)
      .where(eq(attendances.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Attendance record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Attendance ${id} deleted successfully`,
      data: deleted,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete attendance record" },
      { status: 500 }
    );
  }
}
