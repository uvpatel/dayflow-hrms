import { NextRequest } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { errorResponse, successResponse } from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";
import { AuthorizationError } from "@/lib/api/errors";

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "notification:read");

    const employeeId = authContext.employee?.id;
    if (!employeeId) {
      throw new AuthorizationError("A linked employee profile is required");
    }

    const updated = await db
      .update(notifications)
      .set({ read: 1, updatedAt: new Date() })
      .where(eq(notifications.userId, employeeId))
      .returning({ id: notifications.id });

    return successResponse(
      { count: updated.length },
      undefined,
      "All notifications marked as read",
    );
  } catch (error) {
    return errorResponse(error);
  }
}
