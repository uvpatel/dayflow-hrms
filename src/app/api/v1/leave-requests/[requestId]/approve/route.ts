import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leaveRequests } from "@/db/schema";
import { eq } from "drizzle-orm";

type RouteParams = {
  params: Promise<{ requestId: string }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { requestId } = await params;
    const id = Number(requestId);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid leave request ID" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(leaveRequests)
      .set({
        status: "approved",
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
      message: `Leave request ${id} approved successfully`,
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to approve leave request" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return POST(request, { params });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return POST(request, { params });
}
