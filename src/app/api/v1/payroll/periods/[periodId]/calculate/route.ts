import { NextRequest } from "next/server";
import { z } from "zod";
import { payrollService } from "@/features/payroll/payroll.service";
import { errorResponse, successResponse, validateParams } from "@/lib/api";
import { getAuthContext, requireOrganization, requirePermission } from "@/lib/auth/session";

const periodIdParamSchema = z.object({
  periodId: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Valid numeric periodId parameter is required",
    }),
});

type RouteParams = {
  params: Promise<{ periodId: string }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "payroll:manage");
    const organizationId = requireOrganization(authContext);

    const { periodId } = await validateParams(params, periodIdParamSchema);
    const result = await payrollService.calculatePayroll(organizationId, periodId);

    return successResponse(result, undefined, "Payroll calculated successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
