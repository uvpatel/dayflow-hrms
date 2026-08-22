import type { NextRequest } from "next/server";

import {
  createEmployeeSchema,
  employeeQuerySchema,
} from "@/features/employees/employee.schemas";
import { employeeService } from "@/features/employees/employee.service";
import {
  buildPaginationMeta,
  createdResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  validateBody,
  validateQuery,
} from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    const { searchParams } = request.nextUrl;
    const query = validateQuery(searchParams, employeeQuerySchema);
    const { page, limit, offset, search } = parsePagination(searchParams, 50, 100);

    const { items, total } = await employeeService.listEmployeesForActor(
      authContext,
      limit,
      offset,
      search,
      { departmentId: query.departmentId, status: query.status },
    );

    return paginatedResponse(
      items,
      buildPaginationMeta(page, limit, total),
      "Employees fetched successfully",
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "employee:create");
    const data = await validateBody(request, createEmployeeSchema);
    const created = await employeeService.createEmployeeForActor(authContext, data);
    return createdResponse(created, "Employee created successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
