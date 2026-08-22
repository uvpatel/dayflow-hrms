import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendanceCorrections } from "@/db/schema";
import { eq } from "drizzle-orm";

type RouteParams = {
  params: Promise<{ correctionId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { correctionId } = await params;
    const id = Number(correctionId);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid correction ID" },
        { status: 400 }
      );
    }

    const [item] = await db
      .select()
      .from(attendanceCorrections)
      .where(eq(attendanceCorrections.id, id));

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Attendance correction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Attendance correction ${id} fetched successfully`,
      data: item,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch attendance correction" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { correctionId } = await params;
    const id = Number(correctionId);
    const body = await request.json();

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid correction ID" },
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

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Attendance correction not found" },
        { status: 404 }
      );
    }

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

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { correctionId } = await params;
    const id = Number(correctionId);
    const body = await request.json();

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid correction ID" },
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

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Attendance correction not found" },
        { status: 404 }
      );
    }

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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { correctionId } = await params;
    const id = Number(correctionId);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid correction ID" },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(attendanceCorrections)
      .where(eq(attendanceCorrections.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Attendance correction not found" },
        { status: 404 }
      );
    }

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
