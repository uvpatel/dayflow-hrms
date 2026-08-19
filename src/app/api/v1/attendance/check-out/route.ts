import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json(
      {
        success: true,
        message: "Checked out successfully",
        data: {
          employeeId: body.employeeId,
          checkOutTime: new Date().toISOString(),
          location: body.location ?? null,
        },
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
