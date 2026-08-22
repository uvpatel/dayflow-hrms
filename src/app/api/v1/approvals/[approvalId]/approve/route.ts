import { NextRequest } from "next/server";
import { z } from "zod";
import { approvalsService } from "@/features/approvals/approvals.service";
import {
  errorResponse,
  successResponse,
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

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "approval:read");

    const { approvalId } = await validateParams(params, approvalIdParamSchema);
    const updated = await approvalsService.decide(
      authContext,
      approvalId,
      "approved",
    );

    return successResponse(updated, undefined, `Approval request ${approvalId} approved successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}
