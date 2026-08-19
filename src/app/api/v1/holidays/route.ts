import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    return NextResponse.json({
      success: true,
      message: "Holidays fetched successfully",
      data: [],
      meta: { year },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch holidays" },
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
        message: "Holiday created successfully",
        data: body,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create holiday" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: "Holiday updated successfully",
      data: body,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update holiday" },
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
      message: `Holiday ${id} deleted successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete holiday" },
      { status: 500 }
    );
  }
}
