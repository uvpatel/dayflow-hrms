import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendanceCorrections } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") ?? searchParams.get("employeeId");
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.max(1, Number(searchParams.get("limit") ?? 10));
    const offset = (page - 1) * limit;

    const data = await db
      .select()
      .from(attendanceCorrections)
      .where(userId ? eq(attendanceCorrections.userId, userId) : undefined)
      .orderBy(desc(attendanceCorrections.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      message: "Attendance correction requests fetched successfully",
      data,
      meta: { page, limit, count: data.length, userId },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch attendance corrections" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.userId ?? body.employeeId?.toString();

    if (!userId || !body.correctionDate) {
      return NextResponse.json(
        { success: false, error: "userId and correctionDate are required" },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(attendanceCorrections)
      .values({
        userId,
        correctionDate: new Date(body.correctionDate),
        reason: body.reason ?? null,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "Attendance correction request created successfully",
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create attendance correction request" },
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
        { success: false, error: "Valid correction ID is required" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(attendanceCorrections)
      .set({
        userId: body.userId ?? body.employeeId?.toString(),
        correctionDate: new Date(body.correctionDate),
        reason: body.reason ?? null,
        updatedAt: new Date(),
      })
      .where(eq(attendanceCorrections.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      message: `Attendance correction ${id} replaced successfully`,
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to replace attendance correction" },
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
        { success: false, error: "Valid correction ID is required" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(attendanceCorrections)
      .set({
        ...(body.userId !== undefined && { userId: body.userId.toString() }),
        ...(body.correctionDate !== undefined && { correctionDate: new Date(body.correctionDate) }),
        ...(body.reason !== undefined && { reason: body.reason }),
        updatedAt: new Date(),
      })
      .where(eq(attendanceCorrections.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      message: `Attendance correction ${id} updated successfully`,
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update attendance correction" },
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
        { success: false, error: "Valid correction ID is required in query params" },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(attendanceCorrections)
      .where(eq(attendanceCorrections.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      message: `Attendance correction ${id} deleted successfully`,
      data: deleted,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete attendance correction" },
      { status: 500 }
    );
  }
}
