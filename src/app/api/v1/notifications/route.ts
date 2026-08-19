import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 20);

    return NextResponse.json({
      success: true,
      message: "Notifications fetched successfully",
      data: [],
      meta: { unreadOnly, page, limit, total: 0 },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json(
      {
        success: true,
        message: "Notification sent successfully",
        data: body,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to send notification" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json(); // e.g. { markAllAsRead: true } or { notificationIds: [...] }
    return NextResponse.json({
      success: true,
      message: "Notifications marked as read",
      data: body,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    return NextResponse.json({
      success: true,
      message: id ? `Notification ${id} deleted` : "All read notifications cleared",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete notifications" },
      { status: 500 }
    );
  }
}
