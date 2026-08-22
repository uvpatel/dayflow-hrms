import { NextRequest } from "next/server";
import { employeeService } from "@/features/employees/employee.service";
import { updateEmployeeSchema } from "@/features/employees/employee.schemas";
import { errorResponse, successResponse, validateBody } from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "self:read");

    const profile = await employeeService.getMe(authContext);
    return successResponse(profile, undefined, "Current profile fetched successfully");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "self:update");

    const data = await validateBody(request, updateEmployeeSchema);
    const updated = await employeeService.updateMe(authContext, data);

    return successResponse(updated, undefined, "Profile updated successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
