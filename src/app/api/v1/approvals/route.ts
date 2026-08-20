import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { approvalRequests } from "@/db/schema/approval-requests";

export async function GET(request: NextRequest) {
  try {
    
    const approvals = await db.select().from(approvalRequests);
    return NextResponse.json({
      success: true,
      message: "Approval requests fetched successfully",
      data: approvals
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch approvals" },
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
        message: "Approval request created successfully",
        data: body,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create approval request" },
      { status: 500 }
    );
  }
}
