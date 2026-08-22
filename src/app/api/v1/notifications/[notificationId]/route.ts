import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import {
  errorResponse,
  successResponse,
  validateParams,
  NotFoundError,
} from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";
import { AuthorizationError } from "@/lib/api/errors";

const notificationIdParamSchema = z.object({
  notificationId: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Valid numeric notificationId parameter is required",
    }),
});

type RouteParams = {
  params: Promise<{ notificationId: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "notification:read");
    const employeeId = authContext.employee?.id;
    if (!employeeId) {
      throw new AuthorizationError("A linked employee profile is required");
    }

    const { notificationId } = await validateParams(params, notificationIdParamSchema);

    const [updated] = await db
      .update(notifications)
      .set({ read: 1, updatedAt: new Date() })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, employeeId),
      ))
      .returning();

    if (!updated) {
      throw new NotFoundError(`Notification #${notificationId} not found`, "NOTIFICATION_NOT_FOUND");
    }

    return successResponse(updated, undefined, "Notification marked as read");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "notification:read");
    const employeeId = authContext.employee?.id;
    if (!employeeId) {
      throw new AuthorizationError("A linked employee profile is required");
    }

    const { notificationId } = await validateParams(params, notificationIdParamSchema);

    const [deleted] = await db
      .delete(notifications)
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, employeeId),
      ))
      .returning();

    if (!deleted) {
      throw new NotFoundError(`Notification #${notificationId} not found`, "NOTIFICATION_NOT_FOUND");
    }

    return successResponse(deleted, undefined, `Notification #${notificationId} deleted`);
  } catch (error) {
    return errorResponse(error);
  }
}
