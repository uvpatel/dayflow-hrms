import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendances } from "@/db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") ?? "1";

    const [latest] = await db
      .select()
      .from(attendances)
      .where(eq(attendances.userId, userId))
      .orderBy(desc(attendances.date))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: latest ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch check-out status" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.userId ?? body.employeeId?.toString() ?? "1";
    const now = new Date();

    // Find the latest check-in for this user that hasn't checked out yet
    const [latest] = await db
      .select()
      .from(attendances)
      .where(and(eq(attendances.userId, userId), isNull(attendances.checkOutTime)))
      .orderBy(desc(attendances.date))
      .limit(1);

    let result;
    if (latest) {
      const [updated] = await db
        .update(attendances)
        .set({
          checkOutTime: now,
          updatedAt: now,
        })
        .where(eq(attendances.id, latest.id))
        .returning();
      result = updated;
    } else {
      const [created] = await db
        .insert(attendances)
        .values({
          userId,
          date: now,
          checkOutTime: now,
          status: "present",
        })
        .returning();
      result = created;
    }

    return NextResponse.json(
      {
        success: true,
        message: "Checked out successfully",
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to process check-out" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}

export async function PATCH(request: NextRequest) {
  return POST(request);
}
