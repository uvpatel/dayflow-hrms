import { NextRequest, NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ correctionId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { correctionId } = await params;
    return NextResponse.json({
      success: true,
      message: `Attendance correction ${correctionId} fetched successfully`,
      data: { id: correctionId },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch attendance correction" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { correctionId } = await params;
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: `Attendance correction ${correctionId} replaced successfully`,
      data: { id: correctionId, ...body },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to replace attendance correction" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { correctionId } = await params;
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: `Attendance correction ${correctionId} updated successfully`,
      data: { id: correctionId, ...body },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update attendance correction" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { correctionId } = await params;
    return NextResponse.json({
      success: true,
      message: `Attendance correction ${correctionId} deleted successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete attendance correction" },
      { status: 500 }
    );
  }
}
