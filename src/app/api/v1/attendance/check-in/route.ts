import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attendances } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

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
      { success: false, error: "Failed to fetch check-in status" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.userId ?? body.employeeId?.toString() ?? "1";
    const now = new Date();

    const [created] = await db
      .insert(attendances)
      .values({
        userId,
        date: now,
        checkInTime: now,
        status: "present",
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "Checked in successfully",
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to process check-in" },
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
