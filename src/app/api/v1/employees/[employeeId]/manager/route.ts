import type { NextRequest } from "next/server";

import { assignManagerSchema } from "@/features/employees/employee.schemas";
import { employeeService } from "@/features/employees/employee.service";
import {
  employeeIdParamSchema,
  errorResponse,
  successResponse,
  validateBody,
  validateParams,
} from "@/lib/api";
import { getAuthContext } from "@/lib/auth/session";

type RouteParams = { params: Promise<{ employeeId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    const { employeeId } = await validateParams(params, employeeIdParamSchema);
    const { managerId } = await validateBody(request, assignManagerSchema);
    const employee = await employeeService.assignManager(
      authContext,
      employeeId,
      managerId,
    );
    return successResponse(employee, undefined, "Reporting manager updated successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
