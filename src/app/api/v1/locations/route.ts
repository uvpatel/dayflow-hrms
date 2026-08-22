import { NextRequest } from "next/server";
import { organizationService } from "@/features/organization/organization.service";
import { createLocationSchema } from "@/features/organization/organization.schemas";
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
    requirePermission(authContext, "location:read");

    const { searchParams } = new URL(request.url);
    const { page, limit, offset, search } = parsePagination(searchParams, 50);

    const items = await organizationService.listLocations(limit, offset, search);
    const meta = buildPaginationMeta(page, limit, items.length, { search });

    return paginatedResponse(items, meta, "Locations fetched successfully");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "location:manage");

    const data = await validateBody(request, createLocationSchema);
    const created = await organizationService.createLocation(data);

    return createdResponse(created, "Location created successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
