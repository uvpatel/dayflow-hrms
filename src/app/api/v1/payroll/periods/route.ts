import { NextRequest } from "next/server";
import { payrollService } from "@/features/payroll/payroll.service";
import { createPayrollPeriodSchema } from "@/features/payroll/payroll.schemas";
import {
  createdResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  buildPaginationMeta,
  validateBody,
} from "@/lib/api";
import { getAuthContext, requireOrganization, requirePermission } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "payroll:read:any");
    const organizationId = requireOrganization(authContext);

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams, 20);

    const { items, total } = await payrollService.listPeriods(organizationId, limit, offset);
    const meta = buildPaginationMeta(page, limit, total);

    return paginatedResponse(items, meta, "Payroll periods fetched successfully");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "payroll:manage");
    const organizationId = requireOrganization(authContext);

    const data = await validateBody(request, createPayrollPeriodSchema);
    const created = await payrollService.createPeriod(organizationId, data);

    return createdResponse(created, "Payroll period created successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
