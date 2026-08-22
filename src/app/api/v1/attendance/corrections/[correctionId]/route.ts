import { NextRequest } from "next/server";
import { z } from "zod";
import { attendanceService } from "@/features/attendance/attendance.service";
import { updateCorrectionSchema } from "@/features/attendance/attendance.schemas";
import {
  errorResponse,
  successResponse,
  validateBody,
  validateParams,
} from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";

const correctionIdParamSchema = z.object({
  correctionId: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Valid numeric correctionId parameter is required",
    }),
});

type RouteParams = {
  params: Promise<{ correctionId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "attendance:read:any");

    const { correctionId } = await validateParams(params, correctionIdParamSchema);
    const item = await attendanceService.getCorrection(correctionId);

    return successResponse(item, undefined, `Correction ${correctionId} fetched successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "attendance:manage");

    const { correctionId } = await validateParams(params, correctionIdParamSchema);
    const data = await validateBody(request, updateCorrectionSchema);
    const updated = await attendanceService.updateCorrection(correctionId, data);

    return successResponse(updated, undefined, `Correction ${correctionId} updated successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "attendance:manage");

    const { correctionId } = await validateParams(params, correctionIdParamSchema);
    const deleted = await attendanceService.deleteCorrection(correctionId);

    return successResponse(deleted, undefined, `Correction ${correctionId} deleted successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}
