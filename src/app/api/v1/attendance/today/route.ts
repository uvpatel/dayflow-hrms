import type { NextRequest } from "next/server";

import { attendanceService } from "@/features/attendance/attendance.service";
import { errorResponse, successResponse } from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "attendance:self");
    const attendance = await attendanceService.getCheckInStatus(authContext);
    return successResponse(attendance, undefined, "Today's attendance fetched successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
