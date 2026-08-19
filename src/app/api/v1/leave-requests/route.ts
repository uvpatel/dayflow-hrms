import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const employeeId = searchParams.get("employeeId");
    const leaveTypeId = searchParams.get("leaveTypeId");
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 10);

    return NextResponse.json({
      success: true,
      message: "Leave requests fetched successfully",
      data: [],
      meta: { status, employeeId, leaveTypeId, page, limit, total: 0 },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch leave requests" },
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
        message: "Leave request submitted successfully",
        data: body,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to submit leave request" },
      { status: 500 }
    );
  }
}
