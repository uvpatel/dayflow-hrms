import type { NextRequest } from "next/server";

import { timeOffService } from "@/features/time-off/time-off.service";
import { errorResponse, successResponse } from "@/lib/api";
import { AuthorizationError } from "@/lib/api/errors";
import { getAuthContext } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    if (authContext.role === "employee") {
      throw new AuthorizationError(
        "Leave analytics are available to managers, HR, and administrators",
      );
    }

    const { items } = await timeOffService.listRequestsForActor(
      authContext,
      5_000,
      0,
    );
    const byTypeMap = new Map<
      string,
      { type: string; count: number; days: number }
    >();
    for (const requestItem of items) {
      const current = byTypeMap.get(requestItem.leaveType) ?? {
        type: requestItem.leaveType,
        count: 0,
        days: 0,
      };
      current.count += 1;
      current.days += Number(requestItem.days ?? 0);
      byTypeMap.set(requestItem.leaveType, current);
    }

    const countStatus = (status: string) =>
      items.filter((requestItem) => requestItem.status === status).length;
    return successResponse({
      summary: {
        totalRequests: items.length,
        pending: countStatus("pending"),
        approved: countStatus("approved"),
        rejected: countStatus("rejected"),
        cancelled: countStatus("cancelled"),
        totalDays: items.reduce(
          (total, requestItem) => total + Number(requestItem.days ?? 0),
          0,
        ),
      },
      byType: [...byTypeMap.values()].sort(
        (left, right) => right.days - left.days,
      ),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
