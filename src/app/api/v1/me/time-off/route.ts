import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    return NextResponse.json({
      success: true,
      message: "Current user time-off requests fetched successfully",
      data: [],
      meta: { status },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch time-off requests" },
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
        message: "Time-off request created successfully",
        data: body,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create time-off request" },
      { status: 500 }
    );
  }
}
