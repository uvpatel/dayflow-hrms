import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    return NextResponse.json({
      success: true,
      message: "Current user payslips fetched successfully",
      data: [],
      meta: { year },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch payslips" },
      { status: 500 }
    );
  }
}
