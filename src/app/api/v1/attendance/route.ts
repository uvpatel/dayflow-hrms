import { NextRequest } from "next/server";
import { attendanceService } from "@/features/attendance/attendance.service";
import { manualAttendanceSchema } from "@/features/attendance/attendance.schemas";
import {
  createdResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  buildPaginationMeta,
  validateBody,
} from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams, 50, 100);
    const status = searchParams.get("status") || undefined;
    const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined;
    const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined;

    const { items, total } = await attendanceService.listAttendancesForActor(
      authContext,
      limit,
      offset,
      { status, from, to },
    );
    const meta = buildPaginationMeta(page, limit, total, { status });

    return paginatedResponse(items, meta, "Attendance records fetched successfully");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "attendance:manage");

    const data = await validateBody(request, manualAttendanceSchema);
    const created = await attendanceService.createManualAttendance(authContext, data);

    return createdResponse(created, "Attendance record created successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
