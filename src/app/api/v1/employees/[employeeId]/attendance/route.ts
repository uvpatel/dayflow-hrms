import { NextRequest } from "next/server";
import {
  errorResponse,
  successResponse,
  validateParams,
  employeeIdParamSchema,
} from "@/lib/api";
import { getAuthContext } from "@/lib/auth/session";
import { employeeService } from "@/features/employees/employee.service";
import { attendanceRepository } from "@/features/attendance/attendance.repository";

type RouteParams = {
  params: Promise<{ employeeId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    const { employeeId } = await validateParams(params, employeeIdParamSchema);

    await employeeService.assertCanReadEmployee(authContext, employeeId);
    const records = await attendanceRepository.findAttendances(100, 0, {
      organizationId: authContext.organizationId,
      employeeIds: [employeeId],
    });

    return successResponse(records, undefined, `Attendance for employee ${employeeId} fetched successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}
