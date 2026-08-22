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
import { employeeService } from "@/features/employees/employee.service";

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
    const canViewAll = authContext.role === "admin" || authContext.role === "hr";
    if (!canViewAll && authContext.role !== "manager") {
      employeeId = authContext.employee?.id;
    } else if (authContext.role === "manager") {
      if (requestedEmployeeId) {
        await employeeService.assertCanReadEmployee(authContext, requestedEmployeeId);
        employeeId = requestedEmployeeId;
      } else {
        employeeId = authContext.employee?.id;
      }
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
    const created = await timeOffService.submitRequest(authContext, {
      ...data,
      employeeId:
        authContext.role === "admin" || authContext.role === "hr"
          ? data.employeeId
          : authContext.employee?.id,
    });

    return createdResponse(created, "Leave request submitted successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
