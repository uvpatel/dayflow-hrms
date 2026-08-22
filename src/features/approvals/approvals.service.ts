import type { z } from "zod";

import { employeeRepository } from "@/features/employees/employee.repository";
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
} from "@/lib/api/errors";
import { logActivity } from "@/lib/audit/logger";
import type { AuthContext } from "@/lib/auth/session";
import { sendNotification } from "@/lib/notifications/service";
import { approvalsRepository } from "./approvals.repository";
import { createApprovalSchema, updateApprovalSchema } from "./approvals.schemas";

export class ApprovalsService {
  private requireReviewer(authContext: AuthContext) {
    if (!authContext.employee || authContext.organizationId == null) {
      throw new AuthorizationError("An organization-linked employee profile is required");
    }
    if (!(["manager", "hr", "admin"] as const).includes(authContext.role as "manager" | "hr" | "admin")) {
      throw new AuthorizationError("Approval access is limited to managers, HR, and administrators");
    }
    return authContext.employee;
  }

  private async scope(authContext: AuthContext, status?: string) {
    const reviewer = this.requireReviewer(authContext);
    if (authContext.role === "manager") {
      const reports = await employeeRepository.findDirectReports(
        reviewer.id,
        authContext.organizationId,
      );
      return {
        requestorIds: reports.map((employee) => employee.id),
        approverId: reviewer.id,
        status,
      };
    }

    const employees = await employeeRepository.findEmployees(
      10_000,
      0,
      undefined,
      { organizationId: authContext.organizationId },
    );
    return { requestorIds: employees.map((employee) => employee.id), status };
  }

  async listApprovalsForActor(
    authContext: AuthContext,
    limit = 20,
    offset = 0,
    status?: string,
  ) {
    const scope = await this.scope(authContext, status);
    const [items, total] = await Promise.all([
      approvalsRepository.findApprovals(limit, offset, scope),
      approvalsRepository.countApprovals(scope),
    ]);
    return { items, total };
  }

  async getApprovalForActor(authContext: AuthContext, id: number) {
    const approval = await approvalsRepository.findApprovalById(id);
    if (!approval) {
      throw new NotFoundError(`Approval request with ID ${id} not found`, "APPROVAL_NOT_FOUND");
    }

    const scope = await this.scope(authContext);
    if (
      !scope.requestorIds.includes(approval.requestorId) ||
      (scope.approverId !== undefined && approval.approverId !== scope.approverId)
    ) {
      throw new AuthorizationError("This approval request is outside your assigned scope");
    }
    return approval;
  }

  async createApprovalForActor(
    authContext: AuthContext,
    data: z.infer<typeof createApprovalSchema>,
  ) {
    this.requireReviewer(authContext);
    if (authContext.role !== "hr" && authContext.role !== "admin") {
      throw new AuthorizationError("Only HR or administrators can create approval assignments");
    }
    const [requestor, approver] = await Promise.all([
      employeeRepository.findEmployeeById(data.requestorId),
      employeeRepository.findEmployeeById(data.approverId),
    ]);
    if (
      !requestor ||
      !approver ||
      requestor.organizationId !== authContext.organizationId ||
      approver.organizationId !== authContext.organizationId
    ) {
      throw new NotFoundError("Approval participants must belong to your organization", "EMPLOYEE_NOT_FOUND");
    }

    const created = await approvalsRepository.createApproval({
      requestorId: data.requestorId,
      approverId: data.approverId,
      status: "pending",
    });
    await logActivity({
      organizationId: authContext.organizationId!,
      action: "APPROVAL_CREATED",
      description: `Approval request #${created.id} submitted for requestor #${data.requestorId}`,
    });
    return created;
  }

  async decide(
    authContext: AuthContext,
    id: number,
    status: "approved" | "rejected",
    reason?: string,
  ) {
    const approval = await this.getApprovalForActor(authContext, id);
    if (approval.status !== "pending") {
      throw new ConflictError(
        `Approval request is already in status '${approval.status}'`,
        "APPROVAL_ALREADY_RESOLVED",
      );
    }
    if (status === "rejected" && (!reason || reason.trim().length < 3)) {
      throw new ConflictError("A rejection reason is required");
    }

    const updated = await approvalsRepository.decideApproval(id, status);
    if (!updated) {
      throw new ConflictError("Approval request was already resolved", "APPROVAL_ALREADY_RESOLVED");
    }
    await sendNotification({
      userId: approval.requestorId,
      message: status === "approved"
        ? `Your approval request #${id} has been approved.`
        : `Your approval request #${id} has been rejected. Reason: ${reason!.trim()}`,
    });
    await logActivity({
      organizationId: authContext.organizationId!,
      action: status === "approved" ? "APPROVAL_APPROVED" : "APPROVAL_REJECTED",
      description: `Approval request #${id} ${status}`,
    });
    return updated;
  }

  async updateApprovalForActor(
    authContext: AuthContext,
    id: number,
    data: z.infer<typeof updateApprovalSchema>,
  ) {
    await this.getApprovalForActor(authContext, id);
    if (authContext.role !== "hr" && authContext.role !== "admin") {
      throw new AuthorizationError("Only HR or administrators can reassign approvals");
    }
    if (data.approverId) {
      const approver = await employeeRepository.findEmployeeById(data.approverId);
      if (!approver || approver.organizationId !== authContext.organizationId) {
        throw new NotFoundError("Approver not found in your organization", "EMPLOYEE_NOT_FOUND");
      }
    }
    return (await approvalsRepository.updateApproval(id, data))!;
  }

  async deleteApprovalForActor(authContext: AuthContext, id: number) {
    const approval = await this.getApprovalForActor(authContext, id);
    if (authContext.role !== "admin") {
      throw new AuthorizationError("Only administrators can delete approval history");
    }
    if (approval.status !== "pending") {
      throw new ConflictError("Resolved approval history cannot be deleted");
    }
    return (await approvalsRepository.deleteApproval(id))!;
  }
}

export const approvalsService = new ApprovalsService();
