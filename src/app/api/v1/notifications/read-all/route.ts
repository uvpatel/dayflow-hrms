import { NextRequest } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { errorResponse, successResponse } from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "notification:read");

    const employeeId = authContext.employee?.id || 1;

    await db
      .update(notifications)
      .set({ read: 1, updatedAt: new Date() })
      .where(eq(notifications.userId, employeeId));

    return successResponse({ count: 1 }, undefined, "All notifications marked as read");
  } catch (error) {
    return errorResponse(error);
  }
}
