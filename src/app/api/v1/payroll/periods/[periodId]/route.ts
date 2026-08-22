import { NextRequest } from "next/server";
import { z } from "zod";
import { payrollService } from "@/features/payroll/payroll.service";
import { updatePayrollPeriodSchema } from "@/features/payroll/payroll.schemas";
import {
  errorResponse,
  successResponse,
  validateBody,
  validateParams,
} from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";

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

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "payroll:read:any");

    const { periodId } = await validateParams(params, periodIdParamSchema);
    const item = await payrollService.getPeriod(periodId);

    return successResponse(item, undefined, `Payroll period ${periodId} fetched successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "payroll:manage");

    const { periodId } = await validateParams(params, periodIdParamSchema);
    const data = await validateBody(request, updatePayrollPeriodSchema);
    const updated = await payrollService.updatePeriod(periodId, data);

    return successResponse(updated, undefined, `Payroll period ${periodId} updated successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "payroll:manage");

    const { periodId } = await validateParams(params, periodIdParamSchema);
    const deleted = await payrollService.deletePeriod(periodId);

    return successResponse(deleted, undefined, `Payroll period ${periodId} deleted successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}
