import { NextRequest } from "next/server";
import { payrollService } from "@/features/payroll/payroll.service";
import { createSalaryStructureSchema } from "@/features/payroll/payroll.schemas";
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
    requirePermission(authContext, "payroll:manage");

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams, 50);

    const items = await payrollService.listStructures(limit, offset);
    const meta = buildPaginationMeta(page, limit, items.length);

    return paginatedResponse(items, meta, "Salary structures fetched successfully");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "payroll:manage");

    const data = await validateBody(request, createSalaryStructureSchema);
    const created = await payrollService.createStructure(data);

    return createdResponse(created, "Salary structure created successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
