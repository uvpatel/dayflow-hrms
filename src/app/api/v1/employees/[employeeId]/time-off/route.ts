import { NextRequest, NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ employeeId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { employeeId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    return NextResponse.json({
      success: true,
      message: `Time-off records for employee ${employeeId} fetched successfully`,
      data: [],
      meta: { employeeId, status },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch employee time-off records" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { employeeId } = await params;
    const body = await request.json();

    return NextResponse.json(
      {
        success: true,
        message: `Time-off request created for employee ${employeeId}`,
        data: { employeeId, ...body },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to submit employee time-off request" },
      { status: 500 }
    );
  }
}
