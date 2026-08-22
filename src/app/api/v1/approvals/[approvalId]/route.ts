import { NextRequest } from "next/server";
import { z } from "zod";
import { approvalsService } from "@/features/approvals/approvals.service";
import { updateApprovalSchema } from "@/features/approvals/approvals.schemas";
import {
  errorResponse,
  successResponse,
  validateBody,
  validateParams,
} from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";

const approvalIdParamSchema = z.object({
  approvalId: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Valid numeric approvalId parameter is required",
    }),
});

type RouteParams = {
  params: Promise<{ approvalId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "approval:read");

    const { approvalId } = await validateParams(params, approvalIdParamSchema);
    const item = await approvalsService.getApprovalForActor(authContext, approvalId);

    return successResponse(item, undefined, `Approval request ${approvalId} fetched successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "approval:manage");

    const { approvalId } = await validateParams(params, approvalIdParamSchema);
    const data = await validateBody(request, updateApprovalSchema);
    const updated = await approvalsService.updateApprovalForActor(
      authContext,
      approvalId,
      data,
    );

    return successResponse(updated, undefined, `Approval request ${approvalId} updated successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "approval:manage");

    const { approvalId } = await validateParams(params, approvalIdParamSchema);
    const deleted = await approvalsService.deleteApprovalForActor(authContext, approvalId);

    return successResponse(deleted, undefined, `Approval request ${approvalId} deleted successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}
