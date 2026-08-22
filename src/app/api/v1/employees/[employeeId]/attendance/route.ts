import { NextRequest } from "next/server";
import { db } from "@/db";
import { attendances, employees } from "@/db/schema";
import { eq, desc, or } from "drizzle-orm";
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
      requirePermission(authContext, "attendance:read:any");
    }

    const [employee] = await db.select().from(employees).where(eq(employees.id, employeeId));
    if (!employee) {
      throw new NotFoundError(`Employee with ID ${employeeId} not found`, "EMPLOYEE_NOT_FOUND");
    }

    const records = await db
      .select()
      .from(attendances)
      .where(or(eq(attendances.userId, employeeId.toString()), eq(attendances.userId, employee.email)))
      .orderBy(desc(attendances.date))
      .limit(100);

    return successResponse(records, undefined, `Attendance for employee ${employeeId} fetched successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}
