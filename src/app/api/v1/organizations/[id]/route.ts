import { NextRequest } from "next/server";
import { organizationService } from "@/features/organization/organization.service";
import { updateOrganizationSchema } from "@/features/organization/organization.schemas";
import {
  errorResponse,
  successResponse,
  validateBody,
  validateParams,
  numericIdParamSchema,
} from "@/lib/api";
import {
  getAuthContext,
  requireOrganization,
  requirePermission,
} from "@/lib/auth/session";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "organization:read");
    const organizationId = requireOrganization(authContext);

    const { id } = await validateParams(params, numericIdParamSchema);
    const org = await organizationService.getOrganization(organizationId, id);

    return successResponse(org, undefined, `Organization ${id} fetched successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "organization:manage");
    const organizationId = requireOrganization(authContext);

    const { id } = await validateParams(params, numericIdParamSchema);
    const data = await validateBody(request, updateOrganizationSchema);
    const updated = await organizationService.updateOrganization(
      organizationId,
      id,
      data,
    );

    return successResponse(updated, undefined, `Organization ${id} updated successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}
