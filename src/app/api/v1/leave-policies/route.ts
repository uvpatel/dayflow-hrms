import { NextRequest } from "next/server";
import { timeOffService } from "@/features/time-off/time-off.service";
import { createLeavePolicySchema } from "@/features/time-off/time-off.schemas";
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

    const items = await timeOffService.listLeavePolicies(authContext, limit, offset);
    const meta = buildPaginationMeta(page, limit, items.length);

    return paginatedResponse(items, meta, "Leave policies fetched successfully");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "leave:manage");

    const data = await validateBody(request, createLeavePolicySchema);
    const created = await timeOffService.createLeavePolicy(authContext, data);

    return createdResponse(created, "Leave policy created successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
