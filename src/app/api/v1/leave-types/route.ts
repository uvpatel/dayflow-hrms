import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: "Leave types fetched successfully",
      data: [],
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch leave types" },
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
        message: "Leave type created successfully",
        data: body,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create leave type" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: "Leave type updated successfully",
      data: body,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update leave type" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    return NextResponse.json({
      success: true,
      message: `Leave type ${id} deleted successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete leave type" },
      { status: 500 }
    );
  }
}
