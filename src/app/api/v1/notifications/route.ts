import { NextRequest } from "next/server";
import { db } from "@/db";
import { employees, notifications } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import {
  createdResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  buildPaginationMeta,
  validateBody,
} from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";
import { AuthorizationError, NotFoundError } from "@/lib/api/errors";
import { z } from "zod";

const sendNotificationSchema = z.object({
  userId: z.number().int().positive("Valid recipient employee ID is required"),
  message: z.string().trim().min(1, "Message is required").max(1_000),
}).strict();

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "notification:read");

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams, 20);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const employeeId = authContext.employee?.id;
    if (!employeeId) {
      throw new AuthorizationError("A linked employee profile is required");
    }

    const conditions = [eq(notifications.userId, employeeId)];
    if (unreadOnly) {
      conditions.push(eq(notifications.read, 0));
    }

    const items = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    const meta = buildPaginationMeta(page, limit, items.length, { unreadOnly });

    return paginatedResponse(items, meta, "Notifications fetched successfully");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "notification:manage");
    if (authContext.organizationId == null) {
      throw new AuthorizationError("An organization is required");
    }

    const data = await validateBody(request, sendNotificationSchema);
    const [recipient] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(and(
        eq(employees.id, data.userId),
        eq(employees.organizationId, authContext.organizationId),
      ))
      .limit(1);
    if (!recipient) {
      throw new NotFoundError("Recipient employee not found", "EMPLOYEE_NOT_FOUND");
    }
    const [created] = await db
      .insert(notifications)
      .values({
        userId: data.userId,
        message: data.message,
        read: 0,
      })
      .returning();

    return createdResponse(created, "Notification sent successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
