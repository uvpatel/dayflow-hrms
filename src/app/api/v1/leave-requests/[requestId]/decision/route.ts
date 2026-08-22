import type { NextRequest } from "next/server";

import { decideLeaveRequestSchema } from "@/features/time-off/time-off.schemas";
import { timeOffService } from "@/features/time-off/time-off.service";
import {
  errorResponse,
  requestIdParamSchema,
  successResponse,
  validateBody,
  validateParams,
} from "@/lib/api";
import { getAuthContext } from "@/lib/auth/session";

type RouteParams = {
  params: Promise<{ requestId: string }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    const { requestId } = await validateParams(params, requestIdParamSchema);
    const { decision, comment } = await validateBody(
      request,
      decideLeaveRequestSchema,
    );
    const updated = await timeOffService.decideRequest(
      authContext,
      requestId,
      decision,
      comment,
    );

    return successResponse(
      updated,
      undefined,
      `Leave request ${requestId} ${decision} successfully`,
    );
  } catch (error) {
    return errorResponse(error);
  }
}
