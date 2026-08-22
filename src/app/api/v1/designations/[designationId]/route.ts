import { NextRequest } from "next/server";
import { z } from "zod";
import { organizationService } from "@/features/organization/organization.service";
import { updateDesignationSchema } from "@/features/organization/organization.schemas";
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

const designationIdParamSchema = z.object({
  designationId: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Valid numeric designationId parameter is required",
    }),
});

type RouteParams = {
  params: Promise<{ designationId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "designation:read");
    const organizationId = requireOrganization(authContext);

    const { designationId } = await validateParams(params, designationIdParamSchema);
    const des = await organizationService.getDesignation(organizationId, designationId);

    return successResponse(des, undefined, `Designation ${designationId} fetched successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "designation:manage");
    const organizationId = requireOrganization(authContext);

    const { designationId } = await validateParams(params, designationIdParamSchema);
    const data = await validateBody(request, updateDesignationSchema);
    const updated = await organizationService.updateDesignation(
      organizationId,
      designationId,
      data,
    );

    return successResponse(updated, undefined, `Designation ${designationId} updated successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "designation:manage");
    const organizationId = requireOrganization(authContext);

    const { designationId } = await validateParams(params, designationIdParamSchema);
    const deleted = await organizationService.deleteDesignation(organizationId, designationId);

    return successResponse(deleted, undefined, `Designation ${designationId} deleted successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}
