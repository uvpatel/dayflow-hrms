import { NextRequest } from "next/server";
import { z } from "zod";
import { timeOffService } from "@/features/time-off/time-off.service";
import { updateLeaveAllocationSchema } from "@/features/time-off/time-off.schemas";
import {
  errorResponse,
  successResponse,
  validateBody,
  validateParams,
} from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";

const allocationIdParamSchema = z.object({
  allocationId: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Valid numeric allocationId parameter is required",
    }),
});

type RouteParams = {
  params: Promise<{ allocationId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "leave:read:self");

    const { allocationId } = await validateParams(params, allocationIdParamSchema);
    const item = await timeOffService.getAllocationForActor(authContext, allocationId);

    return successResponse(item, undefined, `Leave allocation ${allocationId} fetched successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "leave:manage");

    const { allocationId } = await validateParams(params, allocationIdParamSchema);
    const data = await validateBody(request, updateLeaveAllocationSchema);
    const updated = await timeOffService.updateAllocation(
      authContext,
      allocationId,
      data,
    );

    return successResponse(updated, undefined, `Leave allocation ${allocationId} updated successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "leave:manage");

    const { allocationId } = await validateParams(params, allocationIdParamSchema);
    const deleted = await timeOffService.deleteAllocation(authContext, allocationId);

    return successResponse(deleted, undefined, `Leave allocation ${allocationId} deleted successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}
