import { NextRequest } from "next/server";
import { timeOffService } from "@/features/time-off/time-off.service";
import { approveLeaveRequestSchema } from "@/features/time-off/time-off.schemas";
import {
  errorResponse,
  successResponse,
  validateParams,
  requestIdParamSchema,
} from "@/lib/api";
import { getAuthContext } from "@/lib/auth/session";

type RouteParams = {
  params: Promise<{ requestId: string }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    const { requestId } = await validateParams(params, requestIdParamSchema);
    const body = await request.json().catch(() => ({}));
    const { comment } = approveLeaveRequestSchema.parse(body);
    const updated = await timeOffService.approveRequest(
      authContext,
      requestId,
      comment,
    );

    return successResponse(updated, undefined, `Leave request ${requestId} approved successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}
