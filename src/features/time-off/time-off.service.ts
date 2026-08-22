import { timeOffRepository } from "./time-off.repository";
import {
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BusinessRuleError,
} from "@/lib/api/errors";
import { logActivity } from "@/lib/audit/logger";
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
import { employeeRepository } from "@/features/employees/employee.repository";
import {
  assertPendingCancellation,
  assertRejectComment,
  calculateRequestedDays,
  canDecideLeaveRequest,
  canReadLeaveRequest,
} from "./time-off.domain";

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
    const created = await timeOffRepository.createAllocation({
      ...data,
      allocatedDays: data.allocatedDays.toFixed(2),
      usedDays: data.usedDays.toFixed(2),
    });
    await logActivity({
      action: "LEAVE_ALLOCATION_CREATED",
      description: `Allocated ${created.allocatedDays} days of ${created.leaveType} to employee #${created.employeeId}`,
    });
    return created;
  }

  async updateAllocation(id: number, data: z.infer<typeof updateLeaveAllocationSchema>) {
    await this.getAllocation(id);
    const updated = await timeOffRepository.updateAllocation(id, {
      ...(data.allocatedDays !== undefined && { allocatedDays: data.allocatedDays.toFixed(2) }),
      ...(data.usedDays !== undefined && { usedDays: data.usedDays.toFixed(2) }),
    });
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
  private requireActorEmployee(authContext: AuthContext) {
    if (!authContext.employee?.id || !authContext.organizationId) {
      throw new BusinessRuleError(
        "A linked employee and organization are required for leave operations",
      );
    }
    return authContext.employee;
  }

  private async getRequest(id: number) {
    const item = await timeOffRepository.findRequestById(id);
    if (!item) {
      throw new NotFoundError(`Leave request with ID ${id} not found`, "LEAVE_REQUEST_NOT_FOUND");
    }
    return item;
  }

  private async getRequestSubject(employeeId: number) {
    const subject = await employeeRepository.findEmployeeById(employeeId);
    if (!subject) {
      throw new NotFoundError(
        `Employee with ID ${employeeId} not found`,
        "EMPLOYEE_NOT_FOUND",
      );
    }
    return subject;
  }

  private accessActor(authContext: AuthContext) {
    const employee = this.requireActorEmployee(authContext);
    return {
      role: authContext.role,
      employeeId: employee.id,
      organizationId: authContext.organizationId,
    };
  }

  async listRequestsForActor(
    authContext: AuthContext,
    limit = 20,
    offset = 0,
    requestedEmployeeId?: number,
    status?: string,
  ) {
    const actor = this.accessActor(authContext);
    let employeeIds: number[] | undefined;

    if (actor.role === "admin" || actor.role === "hr") {
      if (requestedEmployeeId) {
        const subject = await this.getRequestSubject(requestedEmployeeId);
        if (subject.organizationId !== actor.organizationId) {
          throw new AuthorizationError("Employee is outside your organization");
        }
        employeeIds = [requestedEmployeeId];
      }
    } else if (actor.role === "manager") {
      const reports = await employeeRepository.findDirectReports(
        actor.employeeId,
        actor.organizationId,
      );
      const allowedIds = [actor.employeeId, ...reports.map((report) => report.id)];
      if (requestedEmployeeId && !allowedIds.includes(requestedEmployeeId)) {
        throw new AuthorizationError("Managers can only view their direct reports");
      }
      employeeIds = requestedEmployeeId ? [requestedEmployeeId] : allowedIds;
    } else {
      employeeIds = [actor.employeeId];
    }

    const scope = {
      organizationId: actor.organizationId,
      employeeIds,
      status,
    };
    const [items, total] = await Promise.all([
      timeOffRepository.findRequests(limit, offset, scope),
      timeOffRepository.countRequests(scope),
    ]);
    return { items, total };
  }

  async getRequestForActor(authContext: AuthContext, id: number) {
    const actor = this.accessActor(authContext);
    const request = await this.getRequest(id);
    const subject = await this.getRequestSubject(request.employeeId);
    if (
      request.organizationId !== actor.organizationId ||
      !canReadLeaveRequest(actor, subject)
    ) {
      throw new AuthorizationError(
        "You can only view your own or an assigned direct report's leave request",
      );
    }
    return request;
  }

  async submitRequest(authContext: AuthContext, data: z.infer<typeof createLeaveRequestSchema>) {
    const actor = this.accessActor(authContext);
    const employeeId =
      (actor.role === "admin" || actor.role === "hr") && data.employeeId
        ? data.employeeId
        : actor.employeeId;
    const subject = await this.getRequestSubject(employeeId);
    if (
      subject.organizationId !== actor.organizationId ||
      subject.employmentStatus !== "active"
    ) {
      throw new AuthorizationError(
        "Leave can only be submitted for an active employee in your organization",
      );
    }

    let requestedDays: number;
    try {
      requestedDays = calculateRequestedDays(data.startDate, data.endDate, data.unit);
    } catch (error) {
      throw new BusinessRuleError(
        error instanceof Error ? error.message : "Invalid leave dates",
      );
    }

    const leaveType = await timeOffRepository.findLeaveTypeByName(
      data.leaveType,
      actor.organizationId,
    );
    if (!leaveType || !leaveType.active) {
      throw new BusinessRuleError("The selected leave type is not available");
    }

    const created = await timeOffRepository.createRequestAtomically({
      employeeId,
      organizationId: actor.organizationId,
      leaveType: data.leaveType,
      startDate: data.startDate,
      endDate: data.endDate,
      days: requestedDays.toFixed(2),
      unit: data.unit,
      reason: data.reason?.trim() || null,
    });
    if (created) return created;

    const overlapping = await timeOffRepository.findOverlappingRequests(
      employeeId,
      data.startDate,
      data.endDate,
    );
    if (overlapping.length > 0) {
      throw new ConflictError(
        "A pending or approved leave request already overlaps these dates.",
        "LEAVE_REQUEST_OVERLAP",
      );
    }

    if (leaveType.requiresBalance) {
      const allocation = await timeOffRepository.findAllocationByEmployeeAndType(
        employeeId,
        data.leaveType,
      );
      const remaining = allocation
        ? Number(allocation.allocatedDays) - Number(allocation.usedDays)
        : 0;
      throw new BusinessRuleError(
        `Insufficient leave balance. ${remaining} days remain for ${data.leaveType}.`,
        "INSUFFICIENT_LEAVE_BALANCE",
      );
    }

    throw new ConflictError("Leave request could not be submitted");
  }

  async decideRequest(
    authContext: AuthContext,
    id: number,
    decision: "approved" | "rejected",
    comment?: string,
  ) {
    const actor = this.accessActor(authContext);
    const request = await this.getRequest(id);
    const subject = await this.getRequestSubject(request.employeeId);
    if (
      request.organizationId !== actor.organizationId ||
      !canDecideLeaveRequest(actor, subject)
    ) {
      throw new AuthorizationError(
        "Only HR, administrators, or the assigned reporting manager can decide this request",
      );
    }
    if (request.status !== "pending") {
      throw new ConflictError(
        `Cannot decide a leave request with status '${request.status}'`,
        "LEAVE_ALREADY_RESOLVED",
      );
    }

    let normalizedComment = comment?.trim() || null;
    if (decision === "rejected") {
      try {
        normalizedComment = assertRejectComment(comment);
      } catch (error) {
        throw new BusinessRuleError(
          error instanceof Error ? error.message : "A rejection comment is required",
        );
      }
    }

    const decided = await timeOffRepository.decideRequestAtomically({
      requestId: id,
      actorEmployeeId: actor.employeeId,
      actorRole: actor.role,
      organizationId: actor.organizationId!,
      decision,
      comment: normalizedComment,
    });
    if (decided) return decided;

    const latest = await this.getRequest(id);
    if (latest.status !== "pending") {
      throw new ConflictError(
        `Leave request is already '${latest.status}'`,
        "LEAVE_ALREADY_RESOLVED",
      );
    }

    const latestSubject = await this.getRequestSubject(latest.employeeId);
    if (!canDecideLeaveRequest(actor, latestSubject)) {
      throw new AuthorizationError("You are no longer assigned to decide this request");
    }
    throw new BusinessRuleError(
      "Insufficient leave balance to approve this request",
      "INSUFFICIENT_LEAVE_BALANCE",
    );
  }

  async approveRequest(authContext: AuthContext, id: number, comment?: string) {
    return this.decideRequest(authContext, id, "approved", comment);
  }

  async rejectRequest(authContext: AuthContext, id: number, reason?: string) {
    return this.decideRequest(authContext, id, "rejected", reason);
  }

  async cancelRequest(authContext: AuthContext, id: number) {
    const actor = this.accessActor(authContext);
    const request = await this.getRequest(id);
    if (
      request.organizationId !== actor.organizationId ||
      request.employeeId !== actor.employeeId
    ) {
      throw new AuthorizationError("Only the request owner can cancel leave");
    }
    try {
      assertPendingCancellation(request.status);
    } catch (error) {
      throw new ConflictError(
        error instanceof Error ? error.message : "Leave request cannot be cancelled",
        "LEAVE_ALREADY_RESOLVED",
      );
    }

    const cancelled = await timeOffRepository.cancelRequestAtomically(
      id,
      actor.employeeId,
      actor.organizationId,
    );
    if (!cancelled) {
      throw new ConflictError(
        "Leave request was already decided or cancelled",
        "LEAVE_ALREADY_RESOLVED",
      );
    }
    return cancelled;
  }

  async updateRequestForActor(
    authContext: AuthContext,
    id: number,
    data: z.infer<typeof updateLeaveRequestSchema>,
  ) {
    const actor = this.accessActor(authContext);
    const request = await this.getRequest(id);
    if (
      request.organizationId !== actor.organizationId ||
      request.employeeId !== actor.employeeId
    ) {
      throw new AuthorizationError("Only the request owner can edit leave");
    }
    if (request.status !== "pending") {
      throw new ConflictError(
        "Only pending leave requests can be edited",
        "LEAVE_ALREADY_RESOLVED",
      );
    }

    const leaveTypeName = data.leaveType ?? request.leaveType;
    const startDate = data.startDate ?? request.startDate;
    const endDate = data.endDate ?? request.endDate;
    const unit = data.unit ?? (request.unit as "full_day" | "half_day");
    let days: number;
    try {
      days = calculateRequestedDays(startDate, endDate, unit);
    } catch (error) {
      throw new BusinessRuleError(
        error instanceof Error ? error.message : "Invalid leave dates",
      );
    }

    const leaveType = await timeOffRepository.findLeaveTypeByName(
      leaveTypeName,
      actor.organizationId,
    );
    if (!leaveType || !leaveType.active) {
      throw new BusinessRuleError("The selected leave type is not available");
    }
    const requiresBalance =
      leaveType.requiresBalance && !leaveTypeName.toLowerCase().includes("unpaid");
    if (requiresBalance) {
      const allocation = await timeOffRepository.findAllocationByEmployeeAndType(
        actor.employeeId,
        leaveTypeName,
      );
      const remaining = allocation
        ? Number(allocation.allocatedDays) - Number(allocation.usedDays)
        : 0;
      if (remaining < days) {
        throw new BusinessRuleError(
          `Insufficient leave balance. ${remaining} days remain for ${leaveTypeName}.`,
          "INSUFFICIENT_LEAVE_BALANCE",
        );
      }
    }

    const updated = await timeOffRepository.updateRequestAtomically({
      requestId: id,
      employeeId: actor.employeeId,
      organizationId: actor.organizationId!,
      leaveType: leaveTypeName,
      startDate,
      endDate,
      unit,
      days: days.toFixed(2),
      reason:
        data.reason !== undefined ? data.reason.trim() || null : request.reason,
    });
    if (updated) return updated;

    const latest = await this.getRequest(id);
    if (latest.status !== "pending") {
      throw new ConflictError(
        "Leave request was decided or cancelled while it was being edited",
        "LEAVE_ALREADY_RESOLVED",
      );
    }
    const overlapping = await timeOffRepository.findOverlappingRequests(
      actor.employeeId,
      startDate,
      endDate,
      id,
    );
    if (overlapping.length > 0) {
      throw new ConflictError(
        "A pending or approved leave request already overlaps these dates.",
        "LEAVE_REQUEST_OVERLAP",
      );
    }
    throw new BusinessRuleError(
      "Insufficient leave balance for the requested update",
      "INSUFFICIENT_LEAVE_BALANCE",
    );
  }
}

export const timeOffService = new TimeOffService();
