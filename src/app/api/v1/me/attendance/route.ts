import { NextRequest } from "next/server";
import { db } from "@/db";
import { attendances } from "@/db/schema";
import { eq, desc, or } from "drizzle-orm";
import { errorResponse, successResponse } from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "self:read");

    const conditions = [
      eq(attendances.userId, authContext.user.id),
      ...(authContext.employee?.id ? [eq(attendances.userId, authContext.employee.id.toString())] : []),
    ];

    const records = await db
      .select()
      .from(attendances)
      .where(or(...conditions))
      .orderBy(desc(attendances.date))
      .limit(100);

    return successResponse(records, undefined, "Self attendance records fetched successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
