import type { NextRequest } from "next/server";
import { and, eq, gte, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  attendanceCorrections,
  attendances,
  departments,
  employees,
  leaveRequests,
} from "@/db/schema";
import { getWorkDate } from "@/features/attendance/attendance.domain";
import { attendanceRepository } from "@/features/attendance/attendance.repository";
import { employeeRepository } from "@/features/employees/employee.repository";
import { AuthorizationError, NotFoundError } from "@/lib/api/errors";
import { errorResponse, successResponse } from "@/lib/api";
import { getAuthContext } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    if (authContext.role === "employee") {
      throw new AuthorizationError("Operational metrics are available to managers, HR, and administrators");
    }
    if (!authContext.employee || authContext.organizationId == null) {
      throw new NotFoundError("An organization-linked employee profile is required", "EMPLOYEE_NOT_FOUND");
    }

    const organizationId = authContext.organizationId;
    const reports = authContext.role === "manager"
      ? await employeeRepository.findDirectReports(
          authContext.employee.id,
          organizationId,
        )
      : null;
    const scopedEmployeeIds = reports?.map((employee) => employee.id);

    const allEmployees = await db
      .select()
      .from(employees)
      .where(
        and(
          eq(employees.organizationId, organizationId),
          eq(employees.employmentStatus, "active"),
          ...(scopedEmployeeIds ? [
            scopedEmployeeIds.length > 0
              ? inArray(employees.id, scopedEmployeeIds)
              : eq(employees.id, -1),
          ] : []),
        ),
      );
    const employeeIds = allEmployees.map((employee) => employee.id);
    const employeeScope = employeeIds.length > 0
      ? inArray(attendances.employeeId, employeeIds)
      : eq(attendances.employeeId, -1);
    const leaveEmployeeScope = employeeIds.length > 0
      ? inArray(leaveRequests.employeeId, employeeIds)
      : eq(leaveRequests.employeeId, -1);
    const correctionEmployeeScope = employeeIds.length > 0
      ? inArray(attendanceCorrections.employeeId, employeeIds)
      : eq(attendanceCorrections.employeeId, -1);

    const timezone = await attendanceRepository.findOrganizationTimezone(organizationId);
    const today = getWorkDate(new Date(), timezone);
    const trendStart = new Date();
    trendStart.setUTCDate(trendStart.getUTCDate() - 6);
    trendStart.setUTCHours(0, 0, 0, 0);

    const [todayAttendance, trendAttendance, pendingLeaves, approvedLeave, pendingCorrections, departmentList] = await Promise.all([
      db.select().from(attendances).where(and(
        eq(attendances.organizationId, organizationId),
        eq(attendances.workDate, today),
        employeeScope,
      )),
      db.select().from(attendances).where(and(
        eq(attendances.organizationId, organizationId),
        gte(attendances.date, trendStart),
        employeeScope,
      )),
      db.select({ id: leaveRequests.id }).from(leaveRequests).where(and(
        eq(leaveRequests.organizationId, organizationId),
        eq(leaveRequests.status, "pending"),
        leaveEmployeeScope,
      )),
      db.select().from(leaveRequests).where(and(
        eq(leaveRequests.organizationId, organizationId),
        eq(leaveRequests.status, "approved"),
        leaveEmployeeScope,
      )),
      db.select({ id: attendanceCorrections.id }).from(attendanceCorrections).where(and(
        eq(attendanceCorrections.organizationId, organizationId),
        eq(attendanceCorrections.status, "pending"),
        correctionEmployeeScope,
      )),
      db.select().from(departments).where(eq(departments.organizationId, organizationId)),
    ]);

    const todayDate = new Date(`${today}T00:00:00.000Z`);
    const onLeaveIds = new Set(
      approvedLeave
        .filter((request) => request.startDate <= todayDate && request.endDate >= todayDate)
        .map((request) => request.employeeId),
    );
    const presentIds = new Set(
      todayAttendance
        .filter((record) => record.status === "present" || record.status === "half_day")
        .map((record) => record.employeeId)
        .filter((id): id is number => id != null),
    );

    const attendanceTrend = new Map<string, { date: string; present: number; absent: number; leave: number }>();
    for (const record of trendAttendance) {
      const date = record.workDate ?? getWorkDate(record.date, timezone);
      const current = attendanceTrend.get(date) ?? { date, present: 0, absent: 0, leave: 0 };
      if (record.status === "present" || record.status === "half_day") current.present += 1;
      if (record.status === "absent") current.absent += 1;
      if (record.status === "leave") current.leave += 1;
      attendanceTrend.set(date, current);
    }

    const departmentDistribution = departmentList
      .map((department) => ({
        department: department.name,
        count: allEmployees.filter((employee) => employee.departmentId === department.id).length,
      }))
      .filter((entry) => entry.count > 0);

    return successResponse({
      totalEmployees: allEmployees.length,
      presentToday: presentIds.size,
      absentToday: Math.max(0, allEmployees.length - presentIds.size - onLeaveIds.size),
      onLeaveToday: onLeaveIds.size,
      pendingApprovals: pendingLeaves.length + pendingCorrections.length,
      attendanceTrend: [...attendanceTrend.values()].sort((left, right) => left.date.localeCompare(right.date)),
      departmentDistribution,
      // Activity logs do not yet carry an organization key, so returning them
      // here would cross tenant boundaries.
      recentActivities: [],
    });
  } catch (error) {
    return errorResponse(error);
  }
}
