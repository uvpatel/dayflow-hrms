import { NextRequest } from "next/server";
import { employeeService } from "@/features/employees/employee.service";
import { organizationService } from "@/features/organization/organization.service";
import { createWorkScheduleSchema } from "@/features/organization/organization.schemas";
import {
  createdResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  buildPaginationMeta,
  validateBody,
} from "@/lib/api";
import { AuthorizationError, NotFoundError, ValidationError } from "@/lib/api/errors";
import {
  getAuthContext,
  requireOrganization,
  requirePermission,
  type AuthContext,
} from "@/lib/auth/session";

function parseEmployeeId(value: string | null): number | undefined {
  if (value === null) return undefined;
  const employeeId = Number(value);
  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    throw new ValidationError("employeeId must be a positive integer");
  }
  return employeeId;
}

async function resolveVisibleEmployeeIds(
  authContext: AuthContext,
  requestedEmployeeId?: number,
): Promise<number[] | undefined> {
  if (authContext.role === "admin" || authContext.role === "hr") {
    return requestedEmployeeId === undefined ? undefined : [requestedEmployeeId];
  }

  const actorEmployeeId = authContext.employee?.id;
  if (!actorEmployeeId) {
    throw new NotFoundError(
      "No employee profile is linked to your user account",
      "EMPLOYEE_NOT_FOUND",
    );
  }

  const visibleEmployeeIds = [actorEmployeeId];
  if (authContext.role === "manager") {
    const directReports = await employeeService.getDirectReports(authContext);
    visibleEmployeeIds.push(...directReports.map((employee) => employee.id));
  }

  if (
    requestedEmployeeId !== undefined &&
    !visibleEmployeeIds.includes(requestedEmployeeId)
  ) {
    throw new AuthorizationError(
      "You can only access your own or an assigned direct report's work schedule",
    );
  }

  return requestedEmployeeId === undefined ? visibleEmployeeIds : [requestedEmployeeId];
}

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "schedule:read");
    const organizationId = requireOrganization(authContext);

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams, 50);
    const employeeId = parseEmployeeId(searchParams.get("employeeId"));
    const employeeIds = await resolveVisibleEmployeeIds(authContext, employeeId);

    const items = await organizationService.listWorkSchedules(
      organizationId,
      limit,
      offset,
      employeeIds,
    );
    const meta = buildPaginationMeta(page, limit, items.length, { employeeId });

    return paginatedResponse(items, meta, "Work schedules fetched successfully");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "schedule:manage");
    const organizationId = requireOrganization(authContext);

    const data = await validateBody(request, createWorkScheduleSchema);
    const created = await organizationService.createWorkSchedule(organizationId, data);

    return createdResponse(created, "Work schedule created successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
