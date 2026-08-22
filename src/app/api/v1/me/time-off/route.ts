import { NextRequest } from "next/server";
import { timeOffService } from "@/features/time-off/time-off.service";
import { errorResponse, successResponse } from "@/lib/api";
import { getAuthContext } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);

    if (!authContext.employee?.id) {
      return successResponse({ allocations: [], requests: [] }, undefined, "No employee profile linked");
    }

    const employeeId = authContext.employee.id;

    const [allocations, requests] = await Promise.all([
      timeOffService.listAllocationsForActor(authContext, 5_000, 0, employeeId),
      timeOffService.listRequestsForActor(authContext, 5_000, 0, employeeId),
    ]);

    return successResponse(
      { allocations, requests: requests.items },
      undefined,
      "Self leave data fetched successfully",
    );
  } catch (error) {
    return errorResponse(error);
  }
}
