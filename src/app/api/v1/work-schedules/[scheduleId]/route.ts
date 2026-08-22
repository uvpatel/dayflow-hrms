import { NextRequest } from "next/server";
import { z } from "zod";
import { employeeService } from "@/features/employees/employee.service";
import { organizationService } from "@/features/organization/organization.service";
import { updateWorkScheduleSchema } from "@/features/organization/organization.schemas";
import {
  errorResponse,
  successResponse,
  validateBody,
  validateParams,
} from "@/lib/api";
import {
  getAuthContext,
  requireOrganization,
  requirePermission,
} from "@/lib/auth/session";

const scheduleIdParamSchema = z.object({
  scheduleId: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Valid numeric scheduleId parameter is required",
    }),
});

type RouteParams = {
  params: Promise<{ scheduleId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "schedule:read");
    const organizationId = requireOrganization(authContext);

    const { scheduleId } = await validateParams(params, scheduleIdParamSchema);
    const sched = await organizationService.getWorkSchedule(organizationId, scheduleId);
    await employeeService.assertCanReadEmployee(authContext, sched.employeeId);

    return successResponse(sched, undefined, `Work schedule ${scheduleId} fetched successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "schedule:manage");
    const organizationId = requireOrganization(authContext);

    const { scheduleId } = await validateParams(params, scheduleIdParamSchema);
    const data = await validateBody(request, updateWorkScheduleSchema);
    const updated = await organizationService.updateWorkSchedule(organizationId, scheduleId, data);

    return successResponse(updated, undefined, `Work schedule ${scheduleId} updated successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "schedule:manage");
    const organizationId = requireOrganization(authContext);

    const { scheduleId } = await validateParams(params, scheduleIdParamSchema);
    const deleted = await organizationService.deleteWorkSchedule(organizationId, scheduleId);

    return successResponse(deleted, undefined, `Work schedule ${scheduleId} deleted successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}
