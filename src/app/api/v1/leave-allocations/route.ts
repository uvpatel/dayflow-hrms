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
} from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "leave:read:self");

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams, 50);
    const employeeId = searchParams.get("employeeId") ? Number(searchParams.get("employeeId")) : undefined;

    const items = await timeOffService.listAllocations(limit, offset, employeeId);
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
    const created = await timeOffService.createAllocation(data);

    return createdResponse(created, "Leave allocation created successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
