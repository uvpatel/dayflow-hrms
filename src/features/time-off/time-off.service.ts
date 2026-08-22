import { timeOffRepository } from "./time-off.repository";
import { NotFoundError, ConflictError, BusinessRuleError } from "@/lib/api/errors";
import { logActivity } from "@/lib/audit/logger";
import { sendNotification } from "@/lib/notifications/service";
import { AuthContext } from "@/lib/auth/session";
import { z } from "zod";
import {
  createLeaveTypeSchema,
  updateLeaveTypeSchema,
  createLeavePolicySchema,
  updateLeavePolicySchema,
  createLeaveAllocationSchema,
  updateLeaveAllocationSchema,
  createLeaveRequestSchema,
  updateLeaveRequestSchema,
} from "./time-off.schemas";

export class TimeOffService {
  // Leave Types
  async listLeaveTypes(limit = 50, offset = 0) {
    return await timeOffRepository.findLeaveTypes(limit, offset);
  }

  async getLeaveType(id: number) {
    const item = await timeOffRepository.findLeaveTypeById(id);
    if (!item) throw new NotFoundError(`Leave type with ID ${id} not found`);
    return item;
  }

  async createLeaveType(data: z.infer<typeof createLeaveTypeSchema>) {
    const created = await timeOffRepository.createLeaveType(data);
    await logActivity({
      action: "LEAVE_TYPE_CREATED",
      description: `Created leave type ${created.name}`,
    });
    return created;
  }

  async updateLeaveType(id: number, data: z.infer<typeof updateLeaveTypeSchema>) {
    await this.getLeaveType(id);
    const updated = await timeOffRepository.updateLeaveType(id, data);
    await logActivity({
      action: "LEAVE_TYPE_UPDATED",
      description: `Updated leave type #${id}`,
    });
    return updated!;
  }

  async deleteLeaveType(id: number) {
    await this.getLeaveType(id);
    const deleted = await timeOffRepository.deleteLeaveType(id);
    await logActivity({
      action: "LEAVE_TYPE_DELETED",
      description: `Deleted leave type #${id}`,
    });
    return deleted!;
  }

  // Leave Policies
  async listLeavePolicies(limit = 50, offset = 0) {
    return await timeOffRepository.findLeavePolicies(limit, offset);
  }

  async getLeavePolicy(id: number) {
    const item = await timeOffRepository.findLeavePolicyById(id);
    if (!item) throw new NotFoundError(`Leave policy with ID ${id} not found`);
    return item;
  }

  async createLeavePolicy(data: z.infer<typeof createLeavePolicySchema>) {
    const created = await timeOffRepository.createLeavePolicy(data);
    await logActivity({
      action: "LEAVE_POLICY_CREATED",
      description: `Created leave policy ${created.name}`,
    });
    return created;
  }

  async updateLeavePolicy(id: number, data: z.infer<typeof updateLeavePolicySchema>) {
    await this.getLeavePolicy(id);
    const updated = await timeOffRepository.updateLeavePolicy(id, data);
    await logActivity({
      action: "LEAVE_POLICY_UPDATED",
      description: `Updated leave policy #${id}`,
    });
    return updated!;
  }

  async deleteLeavePolicy(id: number) {
    await this.getLeavePolicy(id);
    const deleted = await timeOffRepository.deleteLeavePolicy(id);
    await logActivity({
      action: "LEAVE_POLICY_DELETED",
      description: `Deleted leave policy #${id}`,
    });
    return deleted!;
  }

  // Allocations
  async listAllocations(limit = 50, offset = 0, employeeId?: number) {
    return await timeOffRepository.findAllocations(limit, offset, employeeId);
  }

  async getAllocation(id: number) {
    const item = await timeOffRepository.findAllocationById(id);
    if (!item) throw new NotFoundError(`Leave allocation with ID ${id} not found`);
    return item;
  }

  async createAllocation(data: z.infer<typeof createLeaveAllocationSchema>) {
    const created = await timeOffRepository.createAllocation(data);
    await logActivity({
      action: "LEAVE_ALLOCATION_CREATED",
      description: `Allocated ${created.allocatedDays} days of ${created.leaveType} to employee #${created.employeeId}`,
    });
    return created;
  }

  async updateAllocation(id: number, data: z.infer<typeof updateLeaveAllocationSchema>) {
    await this.getAllocation(id);
    const updated = await timeOffRepository.updateAllocation(id, data);
    await logActivity({
      action: "LEAVE_ALLOCATION_UPDATED",
      description: `Updated leave allocation #${id}`,
    });
    return updated!;
  }

  async deleteAllocation(id: number) {
    await this.getAllocation(id);
    const deleted = await timeOffRepository.deleteAllocation(id);
    await logActivity({
      action: "LEAVE_ALLOCATION_DELETED",
      description: `Deleted leave allocation #${id}`,
    });
    return deleted!;
  }

  // Requests
  async listRequests(limit = 20, offset = 0, employeeId?: number, status?: string) {
    const [items, total] = await Promise.all([
      timeOffRepository.findRequests(limit, offset, employeeId, status),
      timeOffRepository.countRequests(employeeId, status),
    ]);
    return { items, total };
  }

  async getRequest(id: number) {
    const item = await timeOffRepository.findRequestById(id);
    if (!item) {
      throw new NotFoundError(`Leave request with ID ${id} not found`, "LEAVE_REQUEST_NOT_FOUND");
    }
    return item;
  }

  async submitRequest(authContext: AuthContext, data: z.infer<typeof createLeaveRequestSchema>) {
    const employeeId = data.employeeId || authContext.employee?.id;
    if (!employeeId) {
      throw new BusinessRuleError("Valid employee profile is required to submit a leave request");
    }

    if (data.endDate < data.startDate) {
      throw new BusinessRuleError("End date cannot be earlier than start date");
    }

    // Check for overlapping requests
    const overlapping = await timeOffRepository.findOverlappingRequests(
      employeeId,
      data.startDate,
      data.endDate
    );
    if (overlapping.length > 0) {
      throw new ConflictError(
        "You already have a pending or approved leave request overlapping these dates.",
        "LEAVE_REQUEST_OVERLAP"
      );
    }

    // Calculate requested duration in days
    const diffTime = Math.abs(data.endDate.getTime() - data.startDate.getTime());
    const requestedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check allocation balance if allocation exists
    const allocation = await timeOffRepository.findAllocationByEmployeeAndType(
      employeeId,
      data.leaveType
    );
    if (allocation) {
      const remainingDays = allocation.allocatedDays - allocation.usedDays;
      if (remainingDays < requestedDays) {
        throw new BusinessRuleError(
          `Insufficient leave balance. You have ${remainingDays} days remaining for ${data.leaveType}, but requested ${requestedDays} days.`,
          "INSUFFICIENT_LEAVE_BALANCE"
        );
      }
    }

    const created = await timeOffRepository.createRequest({
      employeeId,
      leaveType: data.leaveType,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason ?? null,
      status: "pending",
    });

    // Create corresponding approval request for manager
    await timeOffRepository.createApprovalRequest(employeeId, 1, "pending");

    await logActivity({
      action: "LEAVE_REQUESTED",
      description: `Employee #${employeeId} requested ${requestedDays} days of ${data.leaveType}`,
    });

    return created;
  }

  async approveRequest(id: number) {
    const request = await this.getRequest(id);

    if (request.status !== "pending") {
      throw new ConflictError(
        `Cannot approve leave request with status '${request.status}'`,
        "LEAVE_ALREADY_RESOLVED"
      );
    }

    const updated = await timeOffRepository.updateRequest(id, {
      status: "approved",
    });

    // Deduct allocation usedDays if allocation exists
    const allocation = await timeOffRepository.findAllocationByEmployeeAndType(
      request.employeeId,
      request.leaveType
    );
    if (allocation) {
      const diffTime = Math.abs(request.endDate.getTime() - request.startDate.getTime());
      const requestedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      await timeOffRepository.updateAllocation(allocation.id, {
        usedDays: allocation.usedDays + requestedDays,
      });
    }

    await sendNotification({
      userId: request.employeeId,
      message: `Your ${request.leaveType} leave request from ${new Date(request.startDate).toLocaleDateString()} to ${new Date(request.endDate).toLocaleDateString()} has been approved.`,
    });

    await logActivity({
      action: "LEAVE_APPROVED",
      description: `Leave request #${id} for employee #${request.employeeId} approved`,
    });

    return updated!;
  }

  async rejectRequest(id: number, reason?: string) {
    const request = await this.getRequest(id);

    if (request.status !== "pending") {
      throw new ConflictError(
        `Cannot reject leave request with status '${request.status}'`,
        "LEAVE_ALREADY_RESOLVED"
      );
    }

    const updated = await timeOffRepository.updateRequest(id, {
      status: "rejected",
    });

    await sendNotification({
      userId: request.employeeId,
      message: `Your ${request.leaveType} leave request has been rejected.${reason ? ` Reason: ${reason}` : ""}`,
    });

    await logActivity({
      action: "LEAVE_REJECTED",
      description: `Leave request #${id} rejected`,
    });

    return updated!;
  }

  async updateRequest(id: number, data: z.infer<typeof updateLeaveRequestSchema>) {
    await this.getRequest(id);
    const updated = await timeOffRepository.updateRequest(id, data);

    await logActivity({
      action: "LEAVE_REQUEST_UPDATED",
      description: `Updated leave request #${id}`,
    });

    return updated!;
  }

  async deleteRequest(id: number) {
    await this.getRequest(id);
    const deleted = await timeOffRepository.deleteRequest(id);

    await logActivity({
      action: "LEAVE_REQUEST_DELETED",
      description: `Deleted leave request #${id}`,
    });

    return deleted!;
  }
}

export const timeOffService = new TimeOffService();
