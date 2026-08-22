import type { NextRequest } from "next/server";
import { z } from "zod";

import { decideCorrectionSchema } from "@/features/attendance/attendance.schemas";
import { attendanceService } from "@/features/attendance/attendance.service";
import {
  errorResponse,
  successResponse,
  validateBody,
  validateParams,
} from "@/lib/api";
import { getAuthContext } from "@/lib/auth/session";

const correctionIdParamSchema = z.object({
  correctionId: z.coerce.number().int().positive(),
});

type RouteParams = {
  params: Promise<{ correctionId: string }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    const { correctionId } = await validateParams(
      params,
      correctionIdParamSchema,
    );
    const decision = await validateBody(request, decideCorrectionSchema);
    const updated = await attendanceService.decideCorrection(
      authContext,
      correctionId,
      decision,
    );

    return successResponse(
      updated,
      undefined,
      `Attendance correction ${correctionId} ${decision.decision} successfully`,
    );
  } catch (error) {
    return errorResponse(error);
  }
}
