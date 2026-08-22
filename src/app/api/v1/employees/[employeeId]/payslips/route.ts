import { NextRequest } from "next/server";
import { db } from "@/db";
import { payslips, employees } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
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
      requirePermission(authContext, "payroll:read:any");
    }

    const [employee] = await db.select().from(employees).where(eq(employees.id, employeeId));
    if (!employee || employee.organizationId !== authContext.organizationId) {
      throw new NotFoundError(`Employee with ID ${employeeId} not found`, "EMPLOYEE_NOT_FOUND");
    }

    const canManagePayroll =
      authContext.role === "admin" || authContext.role === "hr";

    const records = await db
      .select()
      .from(payslips)
      .where(and(
        eq(payslips.employeeId, employeeId),
        ...(!canManagePayroll ? [eq(payslips.status, "published")] : []),
        ...(authContext.organizationId
          ? [eq(payslips.organizationId, authContext.organizationId)]
          : []),
      ))
      .orderBy(desc(payslips.createdAt))
      .limit(50);

    return successResponse(records, undefined, `Payslips for employee ${employeeId} fetched successfully`);
  } catch (error) {
    return errorResponse(error);
  }
}
