import { NextRequest } from "next/server";
import { z } from "zod";
import { payrollService } from "@/features/payroll/payroll.service";
import { updatePayslipSchema } from "@/features/payroll/payroll.schemas";
import {
  errorResponse,
  successResponse,
  validateBody,
  validateParams,
} from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";

const payslipIdParamSchema = z.object({
  payslipId: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Valid numeric payslipId parameter is required",
    }),
});

type RouteParams = {
  params: Promise<{ payslipId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "payroll:read:any");

    const { payslipId } = await validateParams(params, payslipIdParamSchema);
    const item = await payrollService.getPayslip(payslipId);

    return successResponse(item, undefined, `Payslip ${payslipId} fetched successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "payroll:manage");

    const { payslipId } = await validateParams(params, payslipIdParamSchema);
    const data = await validateBody(request, updatePayslipSchema);
    const updated = await payrollService.updatePayslip(payslipId, data);

    return successResponse(updated, undefined, `Payslip ${payslipId} updated successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "payroll:manage");

    const { payslipId } = await validateParams(params, payslipIdParamSchema);
    const deleted = await payrollService.deletePayslip(payslipId);

    return successResponse(deleted, undefined, `Payslip ${payslipId} deleted successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}
