import { NextRequest, NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ employeeId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { employeeId } = await params;
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    return NextResponse.json({
      success: true,
      message: `Payslips for employee ${employeeId} fetched successfully`,
      data: [],
      meta: { employeeId, year },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch employee payslips" },
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
        message: `Payslip generated for employee ${employeeId}`,
        data: { employeeId, ...body },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to generate employee payslip" },
      { status: 500 }
    );
  }
}
