import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { departments, employees, payrollPeriods, payslips } from "@/db/schema";
import { NotFoundError } from "@/lib/api/errors";
import { errorResponse, successResponse } from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";

function decimalToCents(value: string | null): bigint {
  if (!value) return BigInt(0);
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value);
  if (!match) return BigInt(0);
  return BigInt(match[1]) * BigInt(100) + BigInt((match[2] ?? "").padEnd(2, "0"));
}

function centsForDisplay(value: bigint): number {
  return Number(value) / 100;
}

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "payroll:read:any");
    if (authContext.organizationId == null) {
      throw new NotFoundError("An organization-linked employee profile is required", "EMPLOYEE_NOT_FOUND");
    }

    const organizationId = authContext.organizationId;
    const [organizationPayslips, organizationPeriods, organizationEmployees, organizationDepartments] = await Promise.all([
      db.select().from(payslips).where(eq(payslips.organizationId, organizationId)),
      db.select().from(payrollPeriods).where(eq(payrollPeriods.organizationId, organizationId)),
      db.select().from(employees).where(eq(employees.organizationId, organizationId)),
      db.select().from(departments).where(eq(departments.organizationId, organizationId)),
    ]);

    const published = organizationPayslips.filter((payslip) => payslip.status === "published");
    const totalCents = published.reduce(
      (total, payslip) => total + decimalToCents(payslip.netSalary),
      BigInt(0),
    );
    const employeeById = new Map(
      organizationEmployees.map((employee) => [employee.id, employee]),
    );
    const departmentById = new Map(
      organizationDepartments.map((department) => [department.id, department.name]),
    );
    const departmentCents = new Map<string, bigint>();

    for (const payslip of published) {
      const employee = payslip.employeeId == null
        ? null
        : employeeById.get(payslip.employeeId);
      const department = employee?.departmentId == null
        ? "Unassigned"
        : departmentById.get(employee.departmentId) ?? "Unassigned";
      departmentCents.set(
        department,
        (departmentCents.get(department) ?? BigInt(0)) + decimalToCents(payslip.netSalary),
      );
    }

    return successResponse({
      summary: {
        totalDisbursed: centsForDisplay(totalCents),
        activePeriods: organizationPeriods.filter(
          (period) => period.status !== "finalized" && period.status !== "published",
        ).length,
        payslipsGenerated: organizationPayslips.length,
      },
      costByDepartment: [...departmentCents.entries()]
        .map(([department, cents]) => ({
          department,
          totalPay: centsForDisplay(cents),
        }))
        .sort((left, right) => right.totalPay - left.totalPay),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
