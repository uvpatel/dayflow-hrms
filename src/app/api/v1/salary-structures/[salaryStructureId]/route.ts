import { NextRequest } from "next/server";
import { z } from "zod";
import { payrollService } from "@/features/payroll/payroll.service";
import { updateSalaryStructureSchema } from "@/features/payroll/payroll.schemas";
import {
  errorResponse,
  successResponse,
  validateBody,
  validateParams,
} from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";

const salaryStructureIdParamSchema = z.object({
  salaryStructureId: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Valid numeric salaryStructureId parameter is required",
    }),
});

type RouteParams = {
  params: Promise<{ salaryStructureId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "payroll:manage");

    const { salaryStructureId } = await validateParams(params, salaryStructureIdParamSchema);
    const item = await payrollService.getStructure(salaryStructureId);

    return successResponse(item, undefined, `Salary structure ${salaryStructureId} fetched successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "payroll:manage");

    const { salaryStructureId } = await validateParams(params, salaryStructureIdParamSchema);
    const data = await validateBody(request, updateSalaryStructureSchema);
    const updated = await payrollService.updateStructure(salaryStructureId, data);

    return successResponse(updated, undefined, `Salary structure ${salaryStructureId} updated successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "payroll:manage");

    const { salaryStructureId } = await validateParams(params, salaryStructureIdParamSchema);
    const deleted = await payrollService.deleteStructure(salaryStructureId);

    return successResponse(deleted, undefined, `Salary structure ${salaryStructureId} deleted successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}
