import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";
import { attendanceRepository } from "@/features/attendance/attendance.repository";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "self:read");

    const records = authContext.employee?.id
      ? await attendanceRepository.findAttendances(100, 0, {
          organizationId: authContext.organizationId,
          employeeIds: [authContext.employee.id],
        })
      : [];

    return successResponse(records, undefined, "Self attendance records fetched successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
