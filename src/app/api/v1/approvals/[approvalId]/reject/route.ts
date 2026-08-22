import { NextRequest } from "next/server";
import { z } from "zod";
import { approvalsService } from "@/features/approvals/approvals.service";
import { approvalActionSchema } from "@/features/approvals/approvals.schemas";
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

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "approval:read");

    const { approvalId } = await validateParams(params, approvalIdParamSchema);

    const { reason } = await validateBody(request, approvalActionSchema);
    const updated = await approvalsService.decide(
      authContext,
      approvalId,
      "rejected",
      reason,
    );

    return successResponse(updated, undefined, `Approval request ${approvalId} rejected`);
  } catch (error) {
    return errorResponse(error);
  }
}
