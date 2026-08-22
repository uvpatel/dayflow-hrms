import { NextRequest } from "next/server";
import { payrollService } from "@/features/payroll/payroll.service";
import { createPayslipSchema } from "@/features/payroll/payroll.schemas";
import {
  createdResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
  buildPaginationMeta,
  validateBody,
} from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "payroll:read:any");

    const { searchParams } = new URL(request.url);
    const { page, limit, offset, search } = parsePagination(searchParams, 50);

    const { items, total } = await payrollService.listPayslips(limit, offset, search);
    const meta = buildPaginationMeta(page, limit, total, { search });

    return paginatedResponse(items, meta, "Payslips fetched successfully");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "payroll:manage");

    const data = await validateBody(request, createPayslipSchema);
    const created = await payrollService.createPayslip(data);

    return createdResponse(created, "Payslip generated successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
