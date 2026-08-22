export interface AttendanceScheduleRules {
  timezone: string;
  shiftStartMinutes: number;
  shiftEndMinutes: number;
  breakMinutes: number;
  fullDayMinutes: number;
  halfDayMinutes: number;
  graceMinutes: number;
}

export interface AttendanceCalculation {
  grossMinutes: number;
  breakMinutes: number;
  workMinutes: number;
  overtimeMinutes: number;
  workHours: string;
  status: "present" | "half_day";
}

function zonedParts(at: Date, timezone: string) {
  if (!Number.isFinite(at.getTime())) {
    throw new Error("Invalid attendance timestamp");
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  const year = value("year");
  const month = value("month");
  const day = value("day");
  const hour = Number(value("hour"));
  const minute = Number(value("minute"));

  if (!year || !month || !day || !Number.isInteger(hour) || !Number.isInteger(minute)) {
    throw new Error("Unable to resolve attendance timezone");
  }

  return {
    workDate: `${year}-${month}-${day}`,
    minuteOfDay: hour * 60 + minute,
  };
}

export function getWorkDate(at: Date, timezone: string): string {
  return zonedParts(at, timezone).workDate;
}

export function isLateCheckIn(
  at: Date,
  schedule: Pick<
    AttendanceScheduleRules,
    "timezone" | "shiftStartMinutes" | "graceMinutes"
  >,
): boolean {
  const { minuteOfDay } = zonedParts(at, schedule.timezone);
  return minuteOfDay > schedule.shiftStartMinutes + schedule.graceMinutes;
}

export function calculateAttendance(
  checkInTime: Date,
  checkOutTime: Date,
  schedule: Pick<
    AttendanceScheduleRules,
    "breakMinutes" | "fullDayMinutes" | "halfDayMinutes"
  >,
): AttendanceCalculation {
  const elapsedMs = checkOutTime.getTime() - checkInTime.getTime();
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) {
    throw new Error("Check-out must be after check-in");
  }

  const grossMinutes = Math.floor(elapsedMs / 60_000);
  const breakMinutes = Math.min(
    Math.max(0, schedule.breakMinutes),
    grossMinutes,
  );
  const workMinutes = Math.max(0, grossMinutes - breakMinutes);
  const overtimeMinutes = Math.max(0, workMinutes - schedule.fullDayMinutes);
  const status = workMinutes >= schedule.fullDayMinutes ? "present" : "half_day";

  return {
    grossMinutes,
    breakMinutes,
    workMinutes,
    overtimeMinutes,
    workHours: (workMinutes / 60).toFixed(2),
    status,
  };
}

export function defaultAttendanceSchedule(
  timezone = "UTC",
): AttendanceScheduleRules {
  return {
    timezone,
    shiftStartMinutes: 9 * 60,
    shiftEndMinutes: 17 * 60,
    breakMinutes: 0,
    fullDayMinutes: 8 * 60,
    halfDayMinutes: 4 * 60,
    graceMinutes: 0,
  };
}
