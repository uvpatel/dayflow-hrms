import { NextRequest } from "next/server";
import { z } from "zod";
import { timeOffService } from "@/features/time-off/time-off.service";
import { updateLeavePolicySchema } from "@/features/time-off/time-off.schemas";
import {
  errorResponse,
  successResponse,
  validateBody,
  validateParams,
} from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";

const policyIdParamSchema = z.object({
  policyId: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Valid numeric policyId parameter is required",
    }),
});

type RouteParams = {
  params: Promise<{ policyId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "leave:read:self");

    const { policyId } = await validateParams(params, policyIdParamSchema);
    const item = await timeOffService.getLeavePolicy(policyId);

    return successResponse(item, undefined, `Leave policy ${policyId} fetched successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "leave:manage");

    const { policyId } = await validateParams(params, policyIdParamSchema);
    const data = await validateBody(request, updateLeavePolicySchema);
    const updated = await timeOffService.updateLeavePolicy(policyId, data);

    return successResponse(updated, undefined, `Leave policy ${policyId} updated successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "leave:manage");

    const { policyId } = await validateParams(params, policyIdParamSchema);
    const deleted = await timeOffService.deleteLeavePolicy(policyId);

    return successResponse(deleted, undefined, `Leave policy ${policyId} deleted successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}
