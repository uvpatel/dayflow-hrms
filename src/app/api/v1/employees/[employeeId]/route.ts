import { NextRequest, NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ employeeId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { employeeId } = await params;
    return NextResponse.json({
      success: true,
      message: `Employee ${employeeId} fetched successfully`,
      data: { id: employeeId },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch employee" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { employeeId } = await params;
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: `Employee ${employeeId} replaced successfully`,
      data: { id: employeeId, ...body },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to replace employee" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { employeeId } = await params;
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: `Employee ${employeeId} updated successfully`,
      data: { id: employeeId, ...body },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update employee" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { employeeId } = await params;
    return NextResponse.json({
      success: true,
      message: `Employee ${employeeId} deleted successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete employee" },
      { status: 500 }
    );
  }
}
