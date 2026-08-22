import { NextRequest } from "next/server";
import { timeOffService } from "@/features/time-off/time-off.service";
import {
  errorResponse,
  successResponse,
  validateParams,
  employeeIdParamSchema,
} from "@/lib/api";
import { getAuthContext } from "@/lib/auth/session";

type RouteParams = {
  params: Promise<{ employeeId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    const { employeeId } = await validateParams(params, employeeIdParamSchema);

    const [allocations, requests] = await Promise.all([
      timeOffService.listAllocationsForActor(
        authContext,
        5_000,
        0,
        employeeId,
      ),
      timeOffService.listRequestsForActor(
        authContext,
        5_000,
        0,
        employeeId,
      ),
    ]);

    return successResponse(
      { allocations, requests: requests.items },
      undefined,
      `Time off for employee ${employeeId} fetched successfully`
    );
  } catch (error) {
    return errorResponse(error);
  }
}
