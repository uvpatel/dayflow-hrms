import { NextRequest } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
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
import { z } from "zod";

const sendNotificationSchema = z.object({
  userId: z.number().int().positive("Valid recipient employee ID is required"),
  message: z.string().min(1, "Message is required"),
});

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "notification:read");

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams, 20);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const employeeId = authContext.employee?.id || 1;

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

    const data = await validateBody(request, sendNotificationSchema);
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
