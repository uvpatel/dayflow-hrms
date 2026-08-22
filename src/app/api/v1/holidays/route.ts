import { NextRequest } from "next/server";

import { createHolidaySchema } from "@/features/organization/organization.schemas";
import { organizationService } from "@/features/organization/organization.service";
import {
  buildPaginationMeta,
  createdResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  validateBody,
} from "@/lib/api";
import {
  getAuthContext,
  requireOrganization,
  requirePermission,
} from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "holiday:read");
    const organizationId = requireOrganization(authContext);

    const { searchParams } = new URL(request.url);
    const { page, limit, offset, search } = parsePagination(searchParams, 50);
    const items = await organizationService.listHolidays(
      organizationId,
      limit,
      offset,
      search,
    );
    const meta = buildPaginationMeta(page, limit, items.length, { search });

    return paginatedResponse(items, meta, "Holidays fetched successfully");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "holiday:manage");
    const organizationId = requireOrganization(authContext);

    const data = await validateBody(request, createHolidaySchema);
    const created = await organizationService.createHoliday(organizationId, data);

    return createdResponse(created, "Holiday created successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
