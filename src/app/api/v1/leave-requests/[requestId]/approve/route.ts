import { NextRequest } from "next/server";
import { timeOffService } from "@/features/time-off/time-off.service";
import {
  errorResponse,
  successResponse,
  validateParams,
  requestIdParamSchema,
} from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";

type RouteParams = {
  params: Promise<{ requestId: string }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "leave:approve");

    const { requestId } = await validateParams(params, requestIdParamSchema);
    const updated = await timeOffService.approveRequest(requestId);

    return successResponse(updated, undefined, `Leave request ${requestId} approved successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}
