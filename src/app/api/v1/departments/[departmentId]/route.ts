import { NextRequest, NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ departmentId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { departmentId } = await params;
    return NextResponse.json({
      success: true,
      message: `Department ${departmentId} fetched successfully`,
      data: { id: departmentId },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch department" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { departmentId } = await params;
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: `Department ${departmentId} replaced successfully`,
      data: { id: departmentId, ...body },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to replace department" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { departmentId } = await params;
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: `Department ${departmentId} updated successfully`,
      data: { id: departmentId, ...body },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update department" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { departmentId } = await params;
    return NextResponse.json({
      success: true,
      message: `Department ${departmentId} deleted successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete department" },
      { status: 500 }
    );
  }
}
