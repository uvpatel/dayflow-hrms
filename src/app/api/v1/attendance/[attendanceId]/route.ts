import { NextRequest } from "next/server";
import { z } from "zod";
import { attendanceService } from "@/features/attendance/attendance.service";
import { updateAttendanceSchema } from "@/features/attendance/attendance.schemas";
import {
  errorResponse,
  successResponse,
  validateBody,
  validateParams,
} from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";

const attendanceIdParamSchema = z.object({
  attendanceId: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Valid numeric attendanceId parameter is required",
    }),
});

type RouteParams = {
  params: Promise<{ attendanceId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    const { attendanceId } = await validateParams(params, attendanceIdParamSchema);
    const record = await attendanceService.getAttendanceForActor(
      authContext,
      attendanceId,
    );

    return successResponse(record, undefined, `Attendance ${attendanceId} fetched successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "attendance:manage");

    const { attendanceId } = await validateParams(params, attendanceIdParamSchema);
    await attendanceService.getAttendanceForActor(authContext, attendanceId);
    const data = await validateBody(request, updateAttendanceSchema);
    const updated = await attendanceService.updateAttendance(attendanceId, data);

    return successResponse(updated, undefined, `Attendance ${attendanceId} updated successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "attendance:manage");

    const { attendanceId } = await validateParams(params, attendanceIdParamSchema);
    await attendanceService.getAttendanceForActor(authContext, attendanceId);
    const deleted = await attendanceService.deleteAttendance(attendanceId);

    return successResponse(deleted, undefined, `Attendance ${attendanceId} deleted successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}
