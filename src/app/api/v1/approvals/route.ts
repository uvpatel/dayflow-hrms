import { NextRequest } from "next/server";
import { approvalsService } from "@/features/approvals/approvals.service";
import { createApprovalSchema } from "@/features/approvals/approvals.schemas";
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
    requirePermission(authContext, "approval:read");

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams, 20, 100);
    const approverId = searchParams.get("approverId") ? Number(searchParams.get("approverId")) : undefined;
    const status = searchParams.get("status") || undefined;

    const { items, total } = await approvalsService.listApprovals(limit, offset, approverId, status);
    const meta = buildPaginationMeta(page, limit, total, { approverId, status });

    return paginatedResponse(items, meta, "Approval requests fetched successfully");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "approval:read");

    const data = await validateBody(request, createApprovalSchema);
    const created = await approvalsService.createApproval(data);

    return createdResponse(created, "Approval request created successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
