import type { NextRequest } from "next/server";

import { employeeService } from "@/features/employees/employee.service";
import { errorResponse, successResponse } from "@/lib/api";
import { getAuthContext } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    const team = await employeeService.getDirectReports(authContext);
    return successResponse(
      { items: team, total: team.length },
      undefined,
      "Direct reports fetched successfully",
    );
  } catch (error) {
    return errorResponse(error);
  }
}
