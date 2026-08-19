import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: "Current user profile fetched successfully",
      data: {
        id: "me",
        name: "Current User",
        email: "user@example.com",
        role: "EMPLOYEE",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: "User profile replaced successfully",
      data: body,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: "User profile updated successfully",
      data: body,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
