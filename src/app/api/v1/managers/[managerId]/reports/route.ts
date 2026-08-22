import type { NextRequest } from "next/server";
import { z } from "zod";

import { employeeService } from "@/features/employees/employee.service";
import {
  errorResponse,
  successResponse,
  validateParams,
} from "@/lib/api";
import { getAuthContext } from "@/lib/auth/session";

const managerParamSchema = z.object({
  managerId: z.coerce.number().int().positive(),
});

type RouteParams = { params: Promise<{ managerId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    const { managerId } = await validateParams(params, managerParamSchema);
    const team = await employeeService.getDirectReportsForManager(
      authContext,
      managerId,
    );
    return successResponse(
      { managerId, items: team, total: team.length },
      undefined,
      "Manager reports fetched successfully",
    );
  } catch (error) {
    return errorResponse(error);
  }
}
