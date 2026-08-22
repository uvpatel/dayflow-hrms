import { NextRequest } from "next/server";
import { attendanceService } from "@/features/attendance/attendance.service";
import { punchActionSchema } from "@/features/attendance/attendance.schemas";
import { errorResponse, successResponse, validateBody } from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "attendance:self");

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId") || undefined;
    const userId = requestedUserId || authContext.employee?.id?.toString() || authContext.user.id;

    const latest = await attendanceService.getCheckInStatus(userId);
    return successResponse(latest, undefined, "Check-out status fetched successfully");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "attendance:self");

    let requestedUserId: string | undefined;
    try {
      const body = await validateBody(request, punchActionSchema);
      requestedUserId = body.userId;
    } catch {
      // Body may be empty on direct check-out call
    }

    const updated = await attendanceService.checkOut(authContext, requestedUserId);
    return successResponse(updated, undefined, "Checked out successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
