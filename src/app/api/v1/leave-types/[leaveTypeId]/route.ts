import { NextRequest } from "next/server";
import { z } from "zod";
import { timeOffService } from "@/features/time-off/time-off.service";
import { updateLeaveTypeSchema } from "@/features/time-off/time-off.schemas";
import {
  errorResponse,
  successResponse,
  validateBody,
  validateParams,
} from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";

const leaveTypeIdParamSchema = z.object({
  leaveTypeId: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Valid numeric leaveTypeId parameter is required",
    }),
});

type RouteParams = {
  params: Promise<{ leaveTypeId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "leave:read:self");

    const { leaveTypeId } = await validateParams(params, leaveTypeIdParamSchema);
    const item = await timeOffService.getLeaveType(leaveTypeId);

    return successResponse(item, undefined, `Leave type ${leaveTypeId} fetched successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "leave:manage");

    const { leaveTypeId } = await validateParams(params, leaveTypeIdParamSchema);
    const data = await validateBody(request, updateLeaveTypeSchema);
    const updated = await timeOffService.updateLeaveType(leaveTypeId, data);

    return successResponse(updated, undefined, `Leave type ${leaveTypeId} updated successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "leave:manage");

    const { leaveTypeId } = await validateParams(params, leaveTypeIdParamSchema);
    const deleted = await timeOffService.deleteLeaveType(leaveTypeId);

    return successResponse(deleted, undefined, `Leave type ${leaveTypeId} deleted successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}
