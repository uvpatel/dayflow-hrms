import { NextRequest } from "next/server";
import { db } from "@/db";
import { leaveRequests, leaveAllocations } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { errorResponse, successResponse } from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "self:read");

    if (!authContext.employee?.id) {
      return successResponse({ allocations: [], requests: [] }, undefined, "No employee profile linked");
    }

    const employeeId = authContext.employee.id;

    const [allocations, requests] = await Promise.all([
      db.select().from(leaveAllocations).where(eq(leaveAllocations.employeeId, employeeId)),
      db
        .select()
        .from(leaveRequests)
        .where(eq(leaveRequests.employeeId, employeeId))
        .orderBy(desc(leaveRequests.createdAt)),
    ]);

    return successResponse({ allocations, requests }, undefined, "Self leave data fetched successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
