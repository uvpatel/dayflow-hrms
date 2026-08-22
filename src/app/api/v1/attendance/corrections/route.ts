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
    requirePermission(authContext, "attendance:read:any");

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams, 50, 100);
    const userId = searchParams.get("userId") || undefined;

    const { items, total } = await attendanceService.listCorrections(limit, offset, userId);
    const meta = buildPaginationMeta(page, limit, total, { userId });

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
