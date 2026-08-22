import { NextRequest } from "next/server";
import { z } from "zod";
import { organizationService } from "@/features/organization/organization.service";
import { updateHolidaySchema } from "@/features/organization/organization.schemas";
import {
  errorResponse,
  successResponse,
  validateBody,
  validateParams,
} from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";

const holidayIdParamSchema = z.object({
  holidayId: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Valid numeric holidayId parameter is required",
    }),
});

type RouteParams = {
  params: Promise<{ holidayId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "holiday:read");

    const { holidayId } = await validateParams(params, holidayIdParamSchema);
    const hol = await organizationService.getHoliday(holidayId);

    return successResponse(hol, undefined, `Holiday ${holidayId} fetched successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "holiday:manage");

    const { holidayId } = await validateParams(params, holidayIdParamSchema);
    const data = await validateBody(request, updateHolidaySchema);
    const updated = await organizationService.updateHoliday(holidayId, data);

    return successResponse(updated, undefined, `Holiday ${holidayId} updated successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "holiday:manage");

    const { holidayId } = await validateParams(params, holidayIdParamSchema);
    const deleted = await organizationService.deleteHoliday(holidayId);

    return successResponse(deleted, undefined, `Holiday ${holidayId} deleted successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}
