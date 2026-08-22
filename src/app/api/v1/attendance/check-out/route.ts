import { NextRequest } from "next/server";
import { attendanceService } from "@/features/attendance/attendance.service";
import { errorResponse, successResponse } from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "attendance:self");

    const latest = await attendanceService.getCheckInStatus(authContext);
    return successResponse(latest, undefined, "Check-out status fetched successfully");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "attendance:self");

    const updated = await attendanceService.checkOut(authContext);
    return successResponse(updated, undefined, "Checked out successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
