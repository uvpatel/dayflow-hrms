import { NextRequest } from "next/server";
import { timeOffService } from "@/features/time-off/time-off.service";
import { createLeaveAllocationSchema } from "@/features/time-off/time-off.schemas";
import {
  createdResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  buildPaginationMeta,
  validateBody,
  ValidationError,
} from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "leave:read:self");

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams, 50);
    const employeeIdValue = searchParams.get("employeeId");
    const employeeId = employeeIdValue ? Number(employeeIdValue) : undefined;
    if (employeeId !== undefined && (!Number.isInteger(employeeId) || employeeId <= 0)) {
      throw new ValidationError("employeeId must be a positive integer");
    }

    const items = await timeOffService.listAllocationsForActor(
      authContext,
      limit,
      offset,
      employeeId,
    );
    const meta = buildPaginationMeta(page, limit, items.length, { employeeId });

    return paginatedResponse(items, meta, "Leave allocations fetched successfully");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "leave:manage");

    const data = await validateBody(request, createLeaveAllocationSchema);
    const created = await timeOffService.createAllocation(authContext, data);

    return createdResponse(created, "Leave allocation created successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
