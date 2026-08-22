import { NextRequest } from "next/server";
import { timeOffService } from "@/features/time-off/time-off.service";
import { createLeaveRequestSchema } from "@/features/time-off/time-off.schemas";
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
    requirePermission(authContext, "leave:read:self");

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams, 20, 100);
    const requestedEmployeeId = searchParams.get("employeeId") ? Number(searchParams.get("employeeId")) : undefined;
    const status = searchParams.get("status") || undefined;

    // Regular employees only see their own requests unless they have leave:read:any
    let employeeId = requestedEmployeeId;
    const canViewAll = ["admin", "hr", "manager"].includes(authContext.role);
    if (!canViewAll) {
      employeeId = authContext.employee?.id;
    }

    const { items, total } = await timeOffService.listRequests(limit, offset, employeeId, status);
    const meta = buildPaginationMeta(page, limit, total, { employeeId, status });

    return paginatedResponse(items, meta, "Leave requests fetched successfully");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "leave:create");

    const data = await validateBody(request, createLeaveRequestSchema);
    const created = await timeOffService.submitRequest(authContext, data);

    return createdResponse(created, "Leave request submitted successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
