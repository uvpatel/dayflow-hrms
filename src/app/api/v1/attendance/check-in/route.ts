import { NextRequest } from "next/server";
import { attendanceService } from "@/features/attendance/attendance.service";
import { createdResponse, errorResponse, successResponse } from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "attendance:self");

    const latest = await attendanceService.getCheckInStatus(authContext);
    return successResponse(latest, undefined, "Check-in status fetched successfully");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "attendance:self");

    const created = await attendanceService.checkIn(authContext);
    return createdResponse(created, "Checked in successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
