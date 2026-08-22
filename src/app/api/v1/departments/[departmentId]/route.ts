import { NextRequest } from "next/server";
import { organizationService } from "@/features/organization/organization.service";
import { updateDepartmentSchema } from "@/features/organization/organization.schemas";
import {
  errorResponse,
  successResponse,
  validateBody,
  validateParams,
  departmentIdParamSchema,
} from "@/lib/api";
import {
  getAuthContext,
  requireOrganization,
  requirePermission,
} from "@/lib/auth/session";

type RouteParams = {
  params: Promise<{ departmentId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "department:read");
    const organizationId = requireOrganization(authContext);

    const { departmentId } = await validateParams(params, departmentIdParamSchema);
    const dept = await organizationService.getDepartment(organizationId, departmentId);

    return successResponse(dept, undefined, `Department ${departmentId} fetched successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "department:manage");
    const organizationId = requireOrganization(authContext);

    const { departmentId } = await validateParams(params, departmentIdParamSchema);
    const data = await validateBody(request, updateDepartmentSchema);
    const updated = await organizationService.updateDepartment(organizationId, departmentId, data);

    return successResponse(updated, undefined, `Department ${departmentId} updated successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "department:manage");
    const organizationId = requireOrganization(authContext);

    const { departmentId } = await validateParams(params, departmentIdParamSchema);
    const deleted = await organizationService.deleteDepartment(organizationId, departmentId);

    return successResponse(deleted, undefined, `Department ${departmentId} deleted successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}
