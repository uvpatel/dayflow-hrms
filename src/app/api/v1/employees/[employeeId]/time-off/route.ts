import { NextRequest } from "next/server";
import { db } from "@/db";
import { leaveRequests, leaveAllocations, employees } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  errorResponse,
  successResponse,
  validateParams,
  employeeIdParamSchema,
  NotFoundError,
} from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";

type RouteParams = {
  params: Promise<{ employeeId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authContext = await getAuthContext(request);
    const { employeeId } = await validateParams(params, employeeIdParamSchema);

    if (authContext.employee?.id !== employeeId) {
      requirePermission(authContext, "leave:read:any");
    }

    const [employee] = await db.select().from(employees).where(eq(employees.id, employeeId));
    if (!employee) {
      throw new NotFoundError(`Employee with ID ${employeeId} not found`, "EMPLOYEE_NOT_FOUND");
    }

    const [allocations, requests] = await Promise.all([
      db.select().from(leaveAllocations).where(eq(leaveAllocations.employeeId, employeeId)),
      db
        .select()
        .from(leaveRequests)
        .where(eq(leaveRequests.employeeId, employeeId))
        .orderBy(desc(leaveRequests.createdAt)),
    ]);

    return successResponse(
      { allocations, requests },
      undefined,
      `Time off for employee ${employeeId} fetched successfully`
    );
  } catch (error) {
    return errorResponse(error);
  }
}
