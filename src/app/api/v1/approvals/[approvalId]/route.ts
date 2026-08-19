import { NextRequest, NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ approvalId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { approvalId } = await params;
    return NextResponse.json({
      success: true,
      message: `Approval request ${approvalId} fetched successfully`,
      data: { id: approvalId },
      
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch approval request" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { approvalId } = await params;
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: `Approval request ${approvalId} replaced successfully`,
      data: { id: approvalId, ...body },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to replace approval request" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { approvalId } = await params;
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: `Approval request ${approvalId} updated successfully`,
      data: { id: approvalId, ...body },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update approval request" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { approvalId } = await params;
    return NextResponse.json({
      success: true,
      message: `Approval request ${approvalId} deleted successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete approval request" },
      { status: 500 }
    );
  }
}
