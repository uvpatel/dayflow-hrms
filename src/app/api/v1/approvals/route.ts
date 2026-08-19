import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // LEAVE, ATTENDANCE, EXPENSE, etc.
    const status = searchParams.get("status"); // PENDING, APPROVED, REJECTED
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 10);

    return NextResponse.json({
      success: true,
      message: "Approval requests fetched successfully",
      data: [],
      meta: { type, status, page, limit, total: 0 },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch approvals" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json(
      {
        success: true,
        message: "Approval request created successfully",
        data: body,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create approval request" },
      { status: 500 }
    );
  }
}
