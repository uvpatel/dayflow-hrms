import { NextRequest } from "next/server";

import { createDepartmentSchema } from "@/features/organization/organization.schemas";
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
    requirePermission(authContext, "department:read");
    const organizationId = requireOrganization(authContext);

    const { searchParams } = new URL(request.url);
    const { page, limit, offset, search } = parsePagination(searchParams, 50);
    const items = await organizationService.listDepartments(
      organizationId,
      limit,
      offset,
      search,
    );
    const meta = buildPaginationMeta(page, limit, items.length, { search });

    return paginatedResponse(items, meta, "Departments fetched successfully");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "department:manage");
    const organizationId = requireOrganization(authContext);

    const data = await validateBody(request, createDepartmentSchema);
    const created = await organizationService.createDepartment(organizationId, data);

    return createdResponse(created, "Department created successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
