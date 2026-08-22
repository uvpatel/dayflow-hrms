import { NextRequest } from "next/server";
import { organizationService } from "@/features/organization/organization.service";
import { createDesignationSchema } from "@/features/organization/organization.schemas";
import {
  createdResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  buildPaginationMeta,
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
    requirePermission(authContext, "designation:read");
    const organizationId = requireOrganization(authContext);

    const { searchParams } = new URL(request.url);
    const { page, limit, offset, search } = parsePagination(searchParams, 50);

    const items = await organizationService.listDesignations(
      organizationId,
      limit,
      offset,
      search,
    );
    const meta = buildPaginationMeta(page, limit, items.length, { search });

    return paginatedResponse(items, meta, "Designations fetched successfully");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "designation:manage");
    const organizationId = requireOrganization(authContext);

    const data = await validateBody(request, createDesignationSchema);
    const created = await organizationService.createDesignation(organizationId, data);

    return createdResponse(created, "Designation created successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
