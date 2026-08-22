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
    requirePermission(authContext, "approval:action");

    const { approvalId } = await validateParams(params, approvalIdParamSchema);

    let reason: string | undefined;
    try {
      const body = await request.json();
      reason = body.reason;
    } catch {
      // Body is optional
    }

    const updated = await approvalsService.reject(approvalId, reason);

    return successResponse(updated, undefined, `Approval request ${approvalId} rejected`);
  } catch (error) {
    return errorResponse(error);
  }
}
