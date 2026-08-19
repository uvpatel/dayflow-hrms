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
      message: `Leave request ${requestId} approved successfully`,
      data: {
        id: requestId,
        status: "APPROVED",
        approvedAt: new Date().toISOString(),
        approverComments: body?.comments ?? null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to approve leave request" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return POST(request, { params });
}
