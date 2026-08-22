import { NextRequest } from "next/server";
import { organizationService } from "@/features/organization/organization.service";
import { createOrganizationSchema } from "@/features/organization/organization.schemas";
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
    requirePermission(authContext, "org:read");

    const { searchParams } = new URL(request.url);
    const { page, limit, offset, search } = parsePagination(searchParams);

    const items = await organizationService.listOrganizations(limit, offset, search);
    const meta = buildPaginationMeta(page, limit, items.length, { search });

    return paginatedResponse(items, meta, "Organizations fetched successfully");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "org:manage");

    const data = await validateBody(request, createOrganizationSchema);
    const created = await organizationService.createOrganization(data);

    return createdResponse(created, "Organization created successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
