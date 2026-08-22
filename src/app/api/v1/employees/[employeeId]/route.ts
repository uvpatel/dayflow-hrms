import type { NextRequest } from "next/server";

import {
  employeeIdParamSchema,
  errorResponse,
  successResponse,
  validateBody,
  validateParams,
} from "@/lib/api";
import { employeeService } from "@/features/employees/employee.service";
import { updateEmployeeSchema } from "@/features/employees/employee.schemas";
import { getAuthContext, requirePermission } from "@/lib/auth/session";

interface Params {
  params: Promise<{ employeeId: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const authContext = await getAuthContext(request);
    const { employeeId } = await validateParams(params, employeeIdParamSchema);
    const employee = await employeeService.getEmployeeForActor(
      authContext,
      employeeId,
    );
    return successResponse(employee, undefined, "Employee fetched successfully");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "employee:update");
    const { employeeId } = await validateParams(params, employeeIdParamSchema);
    const data = await validateBody(request, updateEmployeeSchema);
    const employee = await employeeService.updateEmployeeForActor(
      authContext,
      employeeId,
      data,
    );
    return successResponse(employee, undefined, "Employee updated successfully");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "employee:delete");
    const { employeeId } = await validateParams(params, employeeIdParamSchema);
    const employee = await employeeService.updateEmployeeForActor(
      authContext,
      employeeId,
      { employmentStatus: "inactive" },
    );
    return successResponse(employee, undefined, "Employee deactivated successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
