import { NextRequest, NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ requestId: string }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { requestId } = await params;
    const body = await request.json().catch(() => ({}));

    return NextResponse.json({
      success: true,
      message: `Leave request ${requestId} rejected`,
      data: {
        id: requestId,
        status: "REJECTED",
        rejectedAt: new Date().toISOString(),
        rejectionReason: body?.reason ?? "No reason provided",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to reject leave request" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return POST(request, { params });
}
