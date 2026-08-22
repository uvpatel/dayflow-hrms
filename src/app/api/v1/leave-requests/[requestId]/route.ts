import { NextRequest } from "next/server";
import { timeOffService } from "@/features/time-off/time-off.service";
import { updateLeaveRequestSchema } from "@/features/time-off/time-off.schemas";
import {
  errorResponse,
  successResponse,
  validateBody,
  validateParams,
  requestIdParamSchema,
} from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";

type RouteParams = {
  params: Promise<{ requestId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "leave:read:self");

    const { requestId } = await validateParams(params, requestIdParamSchema);
    const item = await timeOffService.getRequest(requestId);

    return successResponse(item, undefined, `Leave request ${requestId} fetched successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "leave:update");

    const { requestId } = await validateParams(params, requestIdParamSchema);
    const data = await validateBody(request, updateLeaveRequestSchema);
    const updated = await timeOffService.updateRequest(requestId, data);

    return successResponse(updated, undefined, `Leave request ${requestId} updated successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "leave:delete");

    const { requestId } = await validateParams(params, requestIdParamSchema);
    const deleted = await timeOffService.deleteRequest(requestId);

    return successResponse(deleted, undefined, `Leave request ${requestId} deleted successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}
