import { NextRequest } from "next/server";
import { z } from "zod";
import { organizationService } from "@/features/organization/organization.service";
import { updateLocationSchema } from "@/features/organization/organization.schemas";
import {
  errorResponse,
  successResponse,
  validateBody,
  validateParams,
} from "@/lib/api";
import {
  getAuthContext,
  requireOrganization,
  requirePermission,
} from "@/lib/auth/session";

const locationIdParamSchema = z.object({
  locationId: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Valid numeric locationId parameter is required",
    }),
});

type RouteParams = {
  params: Promise<{ locationId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "location:read");
    const organizationId = requireOrganization(authContext);

    const { locationId } = await validateParams(params, locationIdParamSchema);
    const loc = await organizationService.getLocation(organizationId, locationId);

    return successResponse(loc, undefined, `Location ${locationId} fetched successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "location:manage");
    const organizationId = requireOrganization(authContext);

    const { locationId } = await validateParams(params, locationIdParamSchema);
    const data = await validateBody(request, updateLocationSchema);
    const updated = await organizationService.updateLocation(organizationId, locationId, data);

    return successResponse(updated, undefined, `Location ${locationId} updated successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "location:manage");
    const organizationId = requireOrganization(authContext);

    const { locationId } = await validateParams(params, locationIdParamSchema);
    const deleted = await organizationService.deleteLocation(organizationId, locationId);

    return successResponse(deleted, undefined, `Location ${locationId} deleted successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}
