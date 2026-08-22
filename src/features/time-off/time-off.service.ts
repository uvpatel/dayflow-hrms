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
  calculateWorkingLeaveDays,
  canDecideLeaveRequest,
  canReadLeaveRequest,
} from "./time-off.domain";

export class TimeOffService {
  // Leave Types
  async listLeaveTypes(authContext: AuthContext, limit = 50, offset = 0) {
    const actor = this.accessActor(authContext);
    return await timeOffRepository.findLeaveTypes(
      actor.organizationId,
      limit,
      offset,
    );
  }

  async getLeaveType(authContext: AuthContext, id: number) {
    const actor = this.accessActor(authContext);
    const item = await timeOffRepository.findLeaveTypeById(actor.organizationId, id);
    if (!item) throw new NotFoundError(`Leave type with ID ${id} not found`);
    return item;
  }

  async createLeaveType(authContext: AuthContext, data: z.infer<typeof createLeaveTypeSchema>) {
    const actor = this.requireLeaveAdministrator(authContext);
    const created = await timeOffRepository.createLeaveType({
      ...data,
      organizationId: actor.organizationId,
    });
    await logActivity({
      organizationId: actor.organizationId,
      action: "LEAVE_TYPE_CREATED",
      description: `Created leave type ${created.name}`,
    });
    return created;
  }

  async updateLeaveType(authContext: AuthContext, id: number, data: z.infer<typeof updateLeaveTypeSchema>) {
    const actor = this.requireLeaveAdministrator(authContext);
    const updated = await timeOffRepository.updateLeaveType(
      actor.organizationId,
      id,
      data,
    );
    if (!updated) throw new NotFoundError(`Leave type with ID ${id} not found`);
    await logActivity({
      organizationId: actor.organizationId,
      action: "LEAVE_TYPE_UPDATED",
      description: `Updated leave type #${id}`,
    });
    return updated!;
  }

  async deleteLeaveType(authContext: AuthContext, id: number) {
    const actor = this.requireLeaveAdministrator(authContext);
    const deleted = await timeOffRepository.deleteLeaveType(actor.organizationId, id);
    if (!deleted) throw new NotFoundError(`Leave type with ID ${id} not found`);
    await logActivity({
      organizationId: actor.organizationId,
      action: "LEAVE_TYPE_DELETED",
      description: `Deleted leave type #${id}`,
    });
    return deleted!;
  }

  // Leave Policies
  async listLeavePolicies(authContext: AuthContext, limit = 50, offset = 0) {
    const actor = this.accessActor(authContext);
    return await timeOffRepository.findLeavePolicies(
      actor.organizationId,
      limit,
      offset,
    );
  }

  async getLeavePolicy(authContext: AuthContext, id: number) {
    const actor = this.accessActor(authContext);
    const item = await timeOffRepository.findLeavePolicyById(actor.organizationId, id);
    if (!item) throw new NotFoundError(`Leave policy with ID ${id} not found`);
    return item;
  }

  async createLeavePolicy(authContext: AuthContext, data: z.infer<typeof createLeavePolicySchema>) {
    const actor = this.requireLeaveAdministrator(authContext);
    const created = await timeOffRepository.createLeavePolicy({
      ...data,
      organizationId: actor.organizationId,
    });
    await logActivity({
      organizationId: actor.organizationId,
      action: "LEAVE_POLICY_CREATED",
      description: `Created leave policy ${created.name}`,
    });
    return created;
  }

  async updateLeavePolicy(authContext: AuthContext, id: number, data: z.infer<typeof updateLeavePolicySchema>) {
    const actor = this.requireLeaveAdministrator(authContext);
    const updated = await timeOffRepository.updateLeavePolicy(
      actor.organizationId,
      id,
      data,
    );
    if (!updated) throw new NotFoundError(`Leave policy with ID ${id} not found`);
    await logActivity({
      organizationId: actor.organizationId,
      action: "LEAVE_POLICY_UPDATED",
      description: `Updated leave policy #${id}`,
    });
    return updated!;
  }

  async deleteLeavePolicy(authContext: AuthContext, id: number) {
    const actor = this.requireLeaveAdministrator(authContext);
    const deleted = await timeOffRepository.deleteLeavePolicy(actor.organizationId, id);
    if (!deleted) throw new NotFoundError(`Leave policy with ID ${id} not found`);
    await logActivity({
      organizationId: actor.organizationId,
      action: "LEAVE_POLICY_DELETED",
      description: `Deleted leave policy #${id}`,
    });
    return deleted!;
  }

  // Allocations
  async listAllocationsForActor(
    authContext: AuthContext,
    limit = 50,
    offset = 0,
    employeeId?: number,
  ) {
    const actor = this.accessActor(authContext);
    const employeeIds = await this.readableEmployeeIds(authContext, employeeId);
    return await timeOffRepository.findAllocations(
      actor.organizationId,
      limit,
      offset,
      employeeIds,
    );
  }

  async getAllocationForActor(authContext: AuthContext, id: number) {
    const actor = this.accessActor(authContext);
    const item = await timeOffRepository.findAllocationById(actor.organizationId, id);
    if (!item) throw new NotFoundError(`Leave allocation with ID ${id} not found`);
    const subject = await this.getRequestSubject(item.employeeId);
    if (!canReadLeaveRequest(actor, subject)) {
      throw new AuthorizationError(
        "You can only view your own or an assigned direct report's leave allocation",
      );
    }
    return item;
  }

  async createAllocation(authContext: AuthContext, data: z.infer<typeof createLeaveAllocationSchema>) {
    const actor = this.requireLeaveAdministrator(authContext);
    const subject = await this.getRequestSubject(data.employeeId);
    if (subject.organizationId !== actor.organizationId) {
      throw new AuthorizationError("Employee is outside your organization");
    }
    const leaveType = await timeOffRepository.findLeaveTypeByName(
      data.leaveType,
      actor.organizationId,
    );
    if (!leaveType?.active) {
      throw new BusinessRuleError("The selected leave type is not available");
    }
    if (data.usedDays > data.allocatedDays) {
      throw new BusinessRuleError("Used leave cannot exceed allocated leave");
    }
    const created = await timeOffRepository.createAllocation({
      ...data,
      allocatedDays: data.allocatedDays.toFixed(2),
      usedDays: data.usedDays.toFixed(2),
    });
    await logActivity({
      organizationId: actor.organizationId,
      action: "LEAVE_ALLOCATION_CREATED",
      description: `Allocated ${created.allocatedDays} days of ${created.leaveType} to employee #${created.employeeId}`,
    });
    return created;
  }

  async updateAllocation(authContext: AuthContext, id: number, data: z.infer<typeof updateLeaveAllocationSchema>) {
    const actor = this.requireLeaveAdministrator(authContext);
    const allocation = await timeOffRepository.findAllocationById(
      actor.organizationId,
      id,
    );
    if (!allocation) throw new NotFoundError(`Leave allocation with ID ${id} not found`);
    const allocatedDays = data.allocatedDays ?? Number(allocation.allocatedDays);
    const usedDays = data.usedDays ?? Number(allocation.usedDays);
    if (usedDays > allocatedDays) {
      throw new BusinessRuleError("Used leave cannot exceed allocated leave");
    }
    const updated = await timeOffRepository.updateAllocation(actor.organizationId, id, {
      ...(data.allocatedDays !== undefined && { allocatedDays: data.allocatedDays.toFixed(2) }),
      ...(data.usedDays !== undefined && { usedDays: data.usedDays.toFixed(2) }),
    });
    await logActivity({
      organizationId: actor.organizationId,
      action: "LEAVE_ALLOCATION_UPDATED",
      description: `Updated leave allocation #${id}`,
    });
    return updated!;
  }

  async deleteAllocation(authContext: AuthContext, id: number) {
    const actor = this.requireLeaveAdministrator(authContext);
    const deleted = await timeOffRepository.deleteAllocation(actor.organizationId, id);
    if (!deleted) throw new NotFoundError(`Leave allocation with ID ${id} not found`);
    await logActivity({
      organizationId: actor.organizationId,
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

  private async requireActiveLeaveType(name: string, organizationId: number) {
    const leaveType = await timeOffRepository.findLeaveTypeByName(
      name,
      organizationId,
    );
    if (!leaveType?.active) {
      throw new BusinessRuleError("The selected leave type is not available");
    }
    return leaveType;
  }

  private async assertLeaveTypeStillActive(
    organizationId: number,
    leaveTypeId: number,
    expectedName: string,
  ) {
    const current = await timeOffRepository.findLeaveTypeById(
      organizationId,
      leaveTypeId,
    );
    if (!current?.active || current.name !== expectedName) {
      throw new BusinessRuleError(
        "The selected leave type changed or became inactive while the operation was in progress",
      );
    }
  }

  private accessActor(authContext: AuthContext): {
    role: AuthContext["role"];
    employeeId: number;
    organizationId: number;
  } {
    const employee = this.requireActorEmployee(authContext);
    const organizationId = authContext.organizationId;
    if (organizationId == null) {
      throw new BusinessRuleError(
        "A linked employee and organization are required for leave operations",
      );
    }
    return {
      role: authContext.role,
      employeeId: employee.id,
      organizationId,
    };
  }

  private requireLeaveAdministrator(authContext: AuthContext) {
    const actor = this.accessActor(authContext);
    if (actor.role !== "admin" && actor.role !== "hr") {
      throw new AuthorizationError("Only HR or administrators can manage leave settings");
    }
    return actor;
  }

  private async readableEmployeeIds(
    authContext: AuthContext,
    requestedEmployeeId?: number,
  ): Promise<number[] | undefined> {
    const actor = this.accessActor(authContext);
    if (actor.role === "admin" || actor.role === "hr") {
      if (!requestedEmployeeId) return undefined;
      const subject = await this.getRequestSubject(requestedEmployeeId);
      if (subject.organizationId !== actor.organizationId) {
        throw new AuthorizationError("Employee is outside your organization");
      }
      return [requestedEmployeeId];
    }

    if (actor.role === "manager") {
      const reports = await employeeRepository.findDirectReports(
        actor.employeeId,
        actor.organizationId,
      );
      const allowedIds = [actor.employeeId, ...reports.map((report) => report.id)];
      if (requestedEmployeeId && !allowedIds.includes(requestedEmployeeId)) {
        throw new AuthorizationError("Managers can only view their direct reports");
      }
      return requestedEmployeeId ? [requestedEmployeeId] : allowedIds;
    }

    if (requestedEmployeeId && requestedEmployeeId !== actor.employeeId) {
      throw new AuthorizationError("Employees can only view their own leave data");
    }
    return [actor.employeeId];
  }

  private async calculateLeaveDays(
    subject: Awaited<ReturnType<typeof employeeRepository.findEmployeeById>> & {},
    organizationId: number,
    startDate: Date,
    endDate: Date,
    unit: "full_day" | "half_day",
  ) {
    const [schedule, holidayDateKeys] = await Promise.all([
      timeOffRepository.findEmployeeSchedule(
        subject.id,
        subject.workScheduleId,
      ),
      timeOffRepository.findHolidayDateKeys(
        organizationId,
        startDate,
        endDate,
      ),
    ]);
    const weekdays = (schedule?.weekdays ?? "1,2,3,4,5")
      .split(",")
      .map((weekday) => Number(weekday.trim()))
      .filter((weekday) => Number.isInteger(weekday) && weekday >= 1 && weekday <= 7);
    return calculateWorkingLeaveDays(
      startDate,
      endDate,
      unit,
      weekdays,
      new Set(holidayDateKeys),
    );
  }

  async listRequestsForActor(
    authContext: AuthContext,
    limit = 20,
    offset = 0,
    requestedEmployeeId?: number,
    status?: string,
  ) {
    const actor = this.accessActor(authContext);
    const employeeIds = await this.readableEmployeeIds(
      authContext,
      requestedEmployeeId,
    );

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
      requestedDays = await this.calculateLeaveDays(
        subject,
        actor.organizationId,
        data.startDate,
        data.endDate,
        data.unit,
      );
    } catch (error) {
      throw new BusinessRuleError(
        error instanceof Error ? error.message : "Invalid leave dates",
      );
    }

    const leaveType = await this.requireActiveLeaveType(
      data.leaveType,
      actor.organizationId,
    );

    const created = await timeOffRepository.createRequestAtomically({
      leaveTypeId: leaveType.id,
      employeeId,
      organizationId: actor.organizationId,
      leaveType: leaveType.name,
      startDate: data.startDate,
      endDate: data.endDate,
      days: requestedDays.toFixed(2),
      unit: data.unit,
      reason: data.reason?.trim() || null,
    });
    if (created) return created;

    await this.assertLeaveTypeStillActive(
      actor.organizationId,
      leaveType.id,
      leaveType.name,
    );

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
        leaveType.name,
      );
      const remaining = allocation
        ? Number(allocation.allocatedDays) - Number(allocation.usedDays)
        : 0;
      throw new BusinessRuleError(
        `Insufficient leave balance. ${remaining} days remain for ${leaveType.name}.`,
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

    const leaveType = await this.requireActiveLeaveType(
      request.leaveType,
      actor.organizationId,
    );

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
      organizationId: actor.organizationId,
      leaveTypeId: leaveType.id,
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

    await this.assertLeaveTypeStillActive(
      actor.organizationId,
      leaveType.id,
      leaveType.name,
    );

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
      const subject = await this.getRequestSubject(actor.employeeId);
      days = await this.calculateLeaveDays(
        subject,
        actor.organizationId,
        startDate,
        endDate,
        unit,
      );
    } catch (error) {
      throw new BusinessRuleError(
        error instanceof Error ? error.message : "Invalid leave dates",
      );
    }

    const leaveType = await this.requireActiveLeaveType(
      leaveTypeName,
      actor.organizationId,
    );
    if (leaveType.requiresBalance) {
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
      leaveTypeId: leaveType.id,
      requestId: id,
      employeeId: actor.employeeId,
      organizationId: actor.organizationId!,
      leaveType: leaveType.name,
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
    await this.assertLeaveTypeStillActive(
      actor.organizationId,
      leaveType.id,
      leaveType.name,
    );
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
