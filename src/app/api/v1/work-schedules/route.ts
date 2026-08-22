import { NextRequest } from "next/server";
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
import { getAuthContext, requirePermission } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "schedule:read");

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams, 50);
    const employeeId = searchParams.get("employeeId") ? Number(searchParams.get("employeeId")) : undefined;

    const items = await organizationService.listWorkSchedules(limit, offset, employeeId);
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

    const data = await validateBody(request, createWorkScheduleSchema);
    const created = await organizationService.createWorkSchedule(data);

    return createdResponse(created, "Work schedule created successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
