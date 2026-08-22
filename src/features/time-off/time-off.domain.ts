export type LeaveUnit = "full_day" | "half_day";

export interface LeaveAccessActor {
  role: "admin" | "hr" | "manager" | "employee";
  employeeId: number;
  organizationId: number | null;
}

export interface LeaveAccessSubject {
  id: number;
  managerId: number | null;
  organizationId: number | null;
}

export function canReadLeaveRequest(
  actor: LeaveAccessActor,
  subject: LeaveAccessSubject,
): boolean {
  if (
    actor.organizationId === null ||
    subject.organizationId !== actor.organizationId
  ) {
    return false;
  }
  if (subject.id === actor.employeeId) return true;
  if (actor.role === "admin" || actor.role === "hr") return true;
  return actor.role === "manager" && subject.managerId === actor.employeeId;
}

export function canDecideLeaveRequest(
  actor: LeaveAccessActor,
  subject: LeaveAccessSubject,
): boolean {
  if (
    actor.organizationId === null ||
    subject.organizationId !== actor.organizationId
  ) {
    return false;
  }
  if (actor.role === "admin" || actor.role === "hr") return true;
  return actor.role === "manager" && subject.managerId === actor.employeeId;
}

function utcCalendarDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function calculateRequestedDays(
  startDate: Date,
  endDate: Date,
  unit: LeaveUnit,
): number {
  if (
    !Number.isFinite(startDate.getTime()) ||
    !Number.isFinite(endDate.getTime())
  ) {
    throw new Error("Leave dates must be valid");
  }

  const startDay = utcCalendarDay(startDate);
  const endDay = utcCalendarDay(endDate);
  if (endDay < startDay) {
    throw new Error("End date cannot be earlier than start date");
  }

  const calendarDays = Math.floor((endDay - startDay) / 86_400_000) + 1;
  if (unit === "half_day") {
    if (calendarDays !== 1) {
      throw new Error("Half-day leave must start and end on the same day");
    }
    return 0.5;
  }
  return calendarDays;
}

export function calculateWorkingLeaveDays(
  startDate: Date,
  endDate: Date,
  unit: LeaveUnit,
  weekdays: readonly number[] = [1, 2, 3, 4, 5],
  holidayDates: ReadonlySet<string> = new Set<string>(),
): number {
  if (
    !Number.isFinite(startDate.getTime()) ||
    !Number.isFinite(endDate.getTime())
  ) {
    throw new Error("Leave dates must be valid");
  }

  const startDay = utcCalendarDay(startDate);
  const endDay = utcCalendarDay(endDate);
  if (endDay < startDay) {
    throw new Error("End date cannot be earlier than start date");
  }
  if (unit === "half_day" && startDay !== endDay) {
    throw new Error("Half-day leave must start and end on the same day");
  }

  const allowedWeekdays = new Set(weekdays);
  let workingDays = 0;
  for (let day = startDay; day <= endDay; day += 86_400_000) {
    const date = new Date(day);
    const isoWeekday = date.getUTCDay() === 0 ? 7 : date.getUTCDay();
    const dateKey = date.toISOString().slice(0, 10);
    if (allowedWeekdays.has(isoWeekday) && !holidayDates.has(dateKey)) {
      workingDays += 1;
    }
  }
  if (workingDays === 0) {
    throw new Error("Leave range does not contain a scheduled working day");
  }
  if (unit === "half_day") return 0.5;
  return workingDays;
}

export function assertSufficientLeaveBalance(
  allocatedDays: number,
  usedDays: number,
  requestedDays: number,
): void {
  const remaining = allocatedDays - usedDays;
  if (requestedDays > remaining) {
    throw new Error(
      `Insufficient leave balance: ${remaining} days remaining`,
    );
  }
}

export function assertRejectComment(comment: string | undefined): string {
  const normalized = comment?.trim();
  if (!normalized) {
    throw new Error("A rejection comment is required");
  }
  return normalized;
}

export function assertPendingCancellation(status: string): void {
  if (status !== "pending") {
    throw new Error("Only pending leave requests can be cancelled");
  }
}
