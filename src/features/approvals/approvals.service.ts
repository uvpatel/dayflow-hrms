import { approvalsRepository } from "./approvals.repository";
import { NotFoundError, ConflictError } from "@/lib/api/errors";
import { logActivity } from "@/lib/audit/logger";
import { sendNotification } from "@/lib/notifications/service";
import { z } from "zod";
import { createApprovalSchema, updateApprovalSchema } from "./approvals.schemas";

export class ApprovalsService {
  async listApprovals(limit = 20, offset = 0, approverId?: number, status?: string) {
    const [items, total] = await Promise.all([
      approvalsRepository.findApprovals(limit, offset, approverId, status),
      approvalsRepository.countApprovals(approverId, status),
    ]);
    return { items, total };
  }

  async getApproval(id: number) {
    const item = await approvalsRepository.findApprovalById(id);
    if (!item) {
      throw new NotFoundError(`Approval request with ID ${id} not found`, "APPROVAL_NOT_FOUND");
    }
    return item;
  }

  async createApproval(data: z.infer<typeof createApprovalSchema>) {
    const created = await approvalsRepository.createApproval({
      requestorId: data.requestorId,
      approverId: data.approverId,
      status: data.status ?? "pending",
    });

    await logActivity({
      action: "APPROVAL_CREATED",
      description: `Approval request #${created.id} submitted for requestor #${data.requestorId}`,
    });

    return created;
  }

  async approve(id: number) {
    const approval = await this.getApproval(id);
    if (approval.status !== "pending") {
      throw new ConflictError(`Approval request is already in status '${approval.status}'`, "APPROVAL_ALREADY_RESOLVED");
    }

    const updated = await approvalsRepository.updateApproval(id, {
      status: "approved",
    });

    await sendNotification({
      userId: approval.requestorId,
      message: `Your approval request #${id} has been approved.`,
    });

    await logActivity({
      action: "APPROVAL_APPROVED",
      description: `Approval request #${id} approved`,
    });

    return updated!;
  }

  async reject(id: number, reason?: string) {
    const approval = await this.getApproval(id);
    if (approval.status !== "pending") {
      throw new ConflictError(`Approval request is already in status '${approval.status}'`, "APPROVAL_ALREADY_RESOLVED");
    }

    const updated = await approvalsRepository.updateApproval(id, {
      status: "rejected",
    });

    await sendNotification({
      userId: approval.requestorId,
      message: `Your approval request #${id} has been rejected.${reason ? ` Reason: ${reason}` : ""}`,
    });

    await logActivity({
      action: "APPROVAL_REJECTED",
      description: `Approval request #${id} rejected`,
    });

    return updated!;
  }

  async updateApproval(id: number, data: z.infer<typeof updateApprovalSchema>) {
    await this.getApproval(id);
    const updated = await approvalsRepository.updateApproval(id, data);

    await logActivity({
      action: "APPROVAL_UPDATED",
      description: `Updated approval request #${id}`,
    });

    return updated!;
  }

  async deleteApproval(id: number) {
    await this.getApproval(id);
    const deleted = await approvalsRepository.deleteApproval(id);

    await logActivity({
      action: "APPROVAL_DELETED",
      description: `Deleted approval request #${id}`,
    });

    return deleted!;
  }
}

export const approvalsService = new ApprovalsService();
