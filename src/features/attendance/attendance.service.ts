import { z } from "zod";

import {
  AuthorizationError,
  BusinessRuleError,
  ConflictError,
  NotFoundError,
} from "@/lib/api/errors";
import { logActivity } from "@/lib/audit/logger";
import { type AuthContext } from "@/lib/auth/session";
import { canAccessEmployeeResource } from "@/lib/permissions";
import { employeeRepository } from "@/features/employees/employee.repository";
import {
  calculateAttendance,
  defaultAttendanceSchedule,
  getWorkDate,
  isLateCheckIn,
} from "./attendance.domain";
import { attendanceRepository, type AttendanceScope } from "./attendance.repository";
import {
  createCorrectionSchema,
  manualAttendanceSchema,
  updateAttendanceSchema,
  updateCorrectionSchema,
} from "./attendance.schemas";

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; cause?: { code?: string } };
  return candidate.code === "23505" || candidate.cause?.code === "23505";
}

export class AttendanceService {
  private requireEmployee(authContext: AuthContext) {
    const employee = authContext.employee;
    if (!employee) {
      throw new NotFoundError(
        "An employee profile is required for attendance",
        "EMPLOYEE_NOT_FOUND",
      );
    }
    if (employee.employmentStatus !== "active") {
      throw new AuthorizationError("Only active employees can check in or out");
    }
    if (employee.organizationId == null) {
      throw new AuthorizationError(
        "Your employee profile is not assigned to an organization",
      );
    }
    return employee;
  }

  private async assertCanReadEmployeeRecord(
    authContext: AuthContext,
    targetEmployeeId: number | null,
    targetOrganizationId: number | null,
  ) {
    const actor = this.requireEmployee(authContext);
    if (targetEmployeeId == null || targetOrganizationId == null) {
      throw new NotFoundError("Attendance record not found", "ATTENDANCE_NOT_FOUND");
    }

    const target = await employeeRepository.findEmployeeById(targetEmployeeId);
    if (
      !target ||
      !canAccessEmployeeResource({
        role: authContext.role,
        resource: "attendance",
        actorEmployeeId: actor.id,
        targetEmployeeId: target.id,
        targetManagerId: target.managerId,
        actorOrganizationId: actor.organizationId,
        targetOrganizationId,
      })
    ) {
      throw new AuthorizationError(
        "You can only access your own or an authorized team attendance record",
      );
    }
  }

  private async scheduleRules(authContext: AuthContext, now: Date) {
    const employee = this.requireEmployee(authContext);
    const schedule = await attendanceRepository.findSchedule(
      employee.id,
      employee.workScheduleId,
      now,
    );
    const organizationTimezone = await attendanceRepository.findOrganizationTimezone(
      employee.organizationId,
    );
    return schedule
      ? {
          timezone: schedule.timezone,
          shiftStartMinutes: schedule.shiftStartMinutes,
          shiftEndMinutes: schedule.shiftEndMinutes,
          breakMinutes: schedule.breakMinutes,
          fullDayMinutes: schedule.fullDayMinutes,
          halfDayMinutes: schedule.halfDayMinutes,
          graceMinutes: schedule.graceMinutes,
        }
      : defaultAttendanceSchedule(organizationTimezone);
  }

  private async readableEmployeeIds(authContext: AuthContext): Promise<number[] | undefined> {
    const employee = this.requireEmployee(authContext);
    if (authContext.role === "admin" || authContext.role === "hr") return undefined;
    if (authContext.role === "manager") {
      const reports = await employeeRepository.findDirectReports(
        employee.id,
        authContext.organizationId,
      );
      return [employee.id, ...reports.map((report) => report.id)];
    }
    return [employee.id];
  }

  async checkIn(authContext: AuthContext) {
    const employee = this.requireEmployee(authContext);
    const now = new Date();
    const schedule = await this.scheduleRules(authContext, now);
    const workDate = getWorkDate(now, schedule.timezone);

    try {
      const created = await attendanceRepository.createAttendance({
        userId: authContext.user.id,
        employeeId: employee.id,
        organizationId: employee.organizationId,
        workDate,
        date: now,
        checkInTime: now,
        checkOutTime: null,
        status: "present",
        scheduledStartMinutes: schedule.shiftStartMinutes,
        scheduledEndMinutes: schedule.shiftEndMinutes,
        scheduleTimezone: schedule.timezone,
        breakMinutes: schedule.breakMinutes,
        isLate: isLateCheckIn(now, schedule),
      });
      await logActivity({
        action: "ATTENDANCE_CHECKED_IN",
        description: `Employee #${employee.id} checked in`,
      });
      return created;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError(
          "You already have an attendance record or active check-in for this workday.",
          "ALREADY_CHECKED_IN",
        );
      }
      throw error;
    }
  }

  async checkOut(authContext: AuthContext) {
    const employee = this.requireEmployee(authContext);
    const now = new Date();
    const openRecord = await attendanceRepository.findOpenAttendance(employee.id);
    if (!openRecord?.checkInTime) {
      throw new ConflictError("No active check-in record was found.", "NOT_CHECKED_IN");
    }

    const schedule = await this.scheduleRules(authContext, now);
    let calculation;
    try {
      calculation = calculateAttendance(openRecord.checkInTime, now, schedule);
    } catch (error) {
      throw new BusinessRuleError(
        error instanceof Error ? error.message : "Invalid attendance transition",
      );
    }

    const updated = await attendanceRepository.closeOpenAttendance(employee.id, now, {
      breakMinutes: calculation.breakMinutes,
      workMinutes: calculation.workMinutes,
      overtimeMinutes: calculation.overtimeMinutes,
      workHours: calculation.workHours,
      status: calculation.status,
    });
    if (!updated) {
      throw new ConflictError("Attendance was already checked out.", "NOT_CHECKED_IN");
    }

    await logActivity({
      action: "ATTENDANCE_CHECKED_OUT",
      description: `Employee #${employee.id} checked out after ${calculation.workMinutes} work minutes`,
    });
    return updated;
  }

  async getCheckInStatus(authContext: AuthContext) {
    const employee = this.requireEmployee(authContext);
    const openRecord = await attendanceRepository.findOpenAttendance(employee.id);
    if (openRecord) return openRecord;

    const now = new Date();
    const schedule = await this.scheduleRules(authContext, now);
    return attendanceRepository.findAttendanceForWorkDate(
      employee.id,
      getWorkDate(now, schedule.timezone),
    );
  }

  async listAttendancesForActor(
    authContext: AuthContext,
    limit = 20,
    offset = 0,
    scope: Omit<AttendanceScope, "organizationId" | "employeeIds"> = {},
  ) {
    const employeeIds = await this.readableEmployeeIds(authContext);
    const scoped = {
      ...scope,
      organizationId: authContext.organizationId,
      employeeIds,
    };
    const [items, total] = await Promise.all([
      attendanceRepository.findAttendances(limit, offset, scoped),
      attendanceRepository.countAttendances(scoped),
    ]);
    return { items, total };
  }

  async getAttendanceForActor(authContext: AuthContext, id: number) {
    const record = await attendanceRepository.findAttendanceById(id);
    if (!record) throw new NotFoundError(`Attendance record with ID ${id} not found`, "ATTENDANCE_NOT_FOUND");
    await this.assertCanReadEmployeeRecord(
      authContext,
      record.employeeId,
      record.organizationId,
    );
    return record;
  }

  async createManualAttendance(
    authContext: AuthContext,
    data: z.infer<typeof manualAttendanceSchema>,
  ) {
    const identity = data.employeeId?.toString() ?? data.userId!;
    const employee = await attendanceRepository.findEmployeeIdentity(identity);
    if (!employee || employee.organizationId !== authContext.organizationId) {
      throw new NotFoundError("Employee not found", "EMPLOYEE_NOT_FOUND");
    }
    const date = data.date ?? data.checkInTime ?? new Date();
    const timezone = await attendanceRepository.findOrganizationTimezone(employee.organizationId);
    return attendanceRepository.createAttendance({
      userId: employee.userId ?? employee.id.toString(),
      employeeId: employee.id,
      organizationId: employee.organizationId,
      workDate: getWorkDate(date, timezone),
      date,
      checkInTime: data.checkInTime ?? null,
      checkOutTime: data.checkOutTime ?? null,
      status: data.status,
      scheduleTimezone: timezone,
    });
  }

  async updateAttendance(id: number, data: z.infer<typeof updateAttendanceSchema>) {
    const record = await attendanceRepository.findAttendanceById(id);
    if (!record) {
      throw new NotFoundError(`Attendance record with ID ${id} not found`, "ATTENDANCE_NOT_FOUND");
    }
    return (await attendanceRepository.updateAttendance(id, data))!;
  }

  async deleteAttendance(id: number) {
    const record = await attendanceRepository.findAttendanceById(id);
    if (!record) {
      throw new NotFoundError(`Attendance record with ID ${id} not found`, "ATTENDANCE_NOT_FOUND");
    }
    return (await attendanceRepository.deleteAttendance(id))!;
  }

  async listCorrectionsForActor(authContext: AuthContext, limit = 20, offset = 0) {
    const employee = this.requireEmployee(authContext);
    const employeeIds = await this.readableEmployeeIds(authContext);
    const [items, total] = await Promise.all([
      attendanceRepository.findCorrections(
        employee.organizationId,
        limit,
        offset,
        employeeIds,
      ),
      attendanceRepository.countCorrections(
        employee.organizationId,
        employeeIds,
      ),
    ]);
    return { items, total };
  }

  async getCorrectionForActor(authContext: AuthContext, id: number) {
    const item = await attendanceRepository.findCorrectionById(id);
    if (!item) throw new NotFoundError(`Attendance correction with ID ${id} not found`, "NOT_FOUND");
    await this.assertCanReadEmployeeRecord(
      authContext,
      item.employeeId,
      item.organizationId,
    );
    return item;
  }

  async requestCorrection(authContext: AuthContext, data: z.infer<typeof createCorrectionSchema>) {
    const employee = this.requireEmployee(authContext);
    if (data.correctionDate.getTime() > Date.now()) {
      throw new BusinessRuleError("Attendance corrections cannot target a future date");
    }
    if (data.attendanceId) {
      const attendance = await attendanceRepository.findAttendanceById(data.attendanceId);
      if (
        !attendance ||
        attendance.employeeId !== employee.id ||
        attendance.organizationId !== employee.organizationId
      ) {
        throw new AuthorizationError(
          "The referenced attendance record does not belong to you",
        );
      }
    }
    return attendanceRepository.createCorrection({
      userId: authContext.user.id,
      employeeId: employee.id,
      organizationId: employee.organizationId,
      attendanceId: data.attendanceId ?? null,
      correctionDate: data.correctionDate,
      requestedCheckInTime: data.requestedCheckInTime ?? null,
      requestedCheckOutTime: data.requestedCheckOutTime ?? null,
      reason: data.reason,
      status: "pending",
    });
  }

  async updateCorrection(id: number, data: z.infer<typeof updateCorrectionSchema>) {
    const item = await attendanceRepository.findCorrectionById(id);
    if (!item) {
      throw new NotFoundError(`Attendance correction with ID ${id} not found`, "NOT_FOUND");
    }
    return (await attendanceRepository.updateCorrection(id, data))!;
  }

  async deleteCorrection(id: number) {
    const item = await attendanceRepository.findCorrectionById(id);
    if (!item) {
      throw new NotFoundError(`Attendance correction with ID ${id} not found`, "NOT_FOUND");
    }
    return (await attendanceRepository.deleteCorrection(id))!;
  }
}

export const attendanceService = new AttendanceService();
