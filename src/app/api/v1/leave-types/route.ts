import { NextRequest } from "next/server";
import { timeOffService } from "@/features/time-off/time-off.service";
import { createLeaveTypeSchema } from "@/features/time-off/time-off.schemas";
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

    const items = await timeOffService.listLeaveTypes(limit, offset);
    const meta = buildPaginationMeta(page, limit, items.length);

    return paginatedResponse(items, meta, "Leave types fetched successfully");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "leave:manage");

    const data = await validateBody(request, createLeaveTypeSchema);
    const created = await timeOffService.createLeaveType(data);

    return createdResponse(created, "Leave type created successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
