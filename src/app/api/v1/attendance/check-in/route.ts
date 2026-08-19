import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json(
      {
        success: true,
        message: "Checked in successfully",
        data: {
          employeeId: body.employeeId,
          checkInTime: new Date().toISOString(),
          location: body.location ?? null,
          status: "PRESENT",
        },
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
