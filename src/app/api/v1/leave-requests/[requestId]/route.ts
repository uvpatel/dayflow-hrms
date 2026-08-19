import { NextRequest, NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ requestId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { requestId } = await params;
    return NextResponse.json({
      success: true,
      message: `Leave request ${requestId} fetched successfully`,
      data: { id: requestId },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch leave request" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { requestId } = await params;
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: `Leave request ${requestId} replaced successfully`,
      data: { id: requestId, ...body },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to replace leave request" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { requestId } = await params;
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: `Leave request ${requestId} updated successfully`,
      data: { id: requestId, ...body },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update leave request" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { requestId } = await params;
    return NextResponse.json({
      success: true,
      message: `Leave request ${requestId} deleted successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete leave request" },
      { status: 500 }
    );
  }
}
