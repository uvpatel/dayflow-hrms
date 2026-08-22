import { NextRequest } from "next/server";
import { attendanceService } from "@/features/attendance/attendance.service";
import { createCorrectionSchema } from "@/features/attendance/attendance.schemas";
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

    const { items, total } = await attendanceService.listCorrectionsForActor(authContext, limit, offset);
    const meta = buildPaginationMeta(page, limit, total);

    return paginatedResponse(items, meta, "Attendance corrections fetched successfully");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "attendance:self");

    const data = await validateBody(request, createCorrectionSchema);
    const created = await attendanceService.requestCorrection(authContext, data);

    return createdResponse(created, "Attendance correction requested successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
