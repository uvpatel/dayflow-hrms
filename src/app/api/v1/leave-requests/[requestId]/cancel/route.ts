import type { NextRequest } from "next/server";

import { timeOffService } from "@/features/time-off/time-off.service";
import {
  errorResponse,
  requestIdParamSchema,
  successResponse,
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
    const cancelled = await timeOffService.cancelRequest(authContext, requestId);

    return successResponse(
      cancelled,
      undefined,
      `Leave request ${requestId} cancelled successfully`,
    );
  } catch (error) {
    return errorResponse(error);
  }
}
