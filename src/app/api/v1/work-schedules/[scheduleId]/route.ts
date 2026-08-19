import { NextRequest, NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ scheduleId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { scheduleId } = await params;
    return NextResponse.json({
      success: true,
      message: `Work schedule ${scheduleId} fetched successfully`,
      data: { id: scheduleId },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch work schedule" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { scheduleId } = await params;
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: `Work schedule ${scheduleId} replaced successfully`,
      data: { id: scheduleId, ...body },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to replace work schedule" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { scheduleId } = await params;
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: `Work schedule ${scheduleId} updated successfully`,
      data: { id: scheduleId, ...body },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update work schedule" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { scheduleId } = await params;
    return NextResponse.json({
      success: true,
      message: `Work schedule ${scheduleId} deleted successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete work schedule" },
      { status: 500 }
    );
  }
}
