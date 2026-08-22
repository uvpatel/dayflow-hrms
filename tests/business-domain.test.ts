import { describe, expect, test } from "bun:test";

import {
  calculateAttendance,
  getWorkDate,
  isLateCheckIn,
} from "../src/features/attendance/attendance.domain";
import { validateManagerAssignment } from "../src/features/employees/employee.domain";
import {
  assertPendingCancellation,
  assertRejectComment,
  assertSufficientLeaveBalance,
  calculateRequestedDays,
} from "../src/features/time-off/time-off.domain";

describe("attendance domain rules", () => {
  test("uses the employee timezone to determine the work date", () => {
    const instant = new Date("2026-08-22T01:00:00.000Z");
    expect(getWorkDate(instant, "America/Los_Angeles")).toBe("2026-08-21");
    expect(getWorkDate(instant, "Asia/Kolkata")).toBe("2026-08-22");
  });

  test("calculates work, break, overtime, and full-day status", () => {
    const result = calculateAttendance(
      new Date("2026-08-22T09:00:00.000Z"),
      new Date("2026-08-22T18:00:00.000Z"),
      { breakMinutes: 60, fullDayMinutes: 480, halfDayMinutes: 240 },
    );

    expect(result.workMinutes).toBe(480);
    expect(result.breakMinutes).toBe(60);
    expect(result.overtimeMinutes).toBe(0);
    expect(result.workHours).toBe("8.00");
    expect(result.status).toBe("present");
  });

  test("rejects check-out at or before check-in", () => {
    expect(() =>
      calculateAttendance(
        new Date("2026-08-22T09:00:00.000Z"),
        new Date("2026-08-22T09:00:00.000Z"),
        { breakMinutes: 0, fullDayMinutes: 480, halfDayMinutes: 240 },
      ),
    ).toThrow("after check-in");
  });

  test("applies schedule grace when determining lateness", () => {
    expect(
      isLateCheckIn(new Date("2026-08-22T09:11:00.000Z"), {
        timezone: "UTC",
        shiftStartMinutes: 540,
        graceMinutes: 10,
      }),
    ).toBe(true);
  });
});

describe("manager assignment rules", () => {
  const employee = {
    id: 10,
    organizationId: 1,
    role: "employee",
    employmentStatus: "active",
  };
  const manager = {
    id: 20,
    organizationId: 1,
    role: "manager",
    employmentStatus: "active",
  };

  test("accepts an active manager in the same organization", () => {
    expect(() => validateManagerAssignment(employee, manager, [30])).not.toThrow();
  });

  test("rejects self-management and circular reporting", () => {
    expect(() => validateManagerAssignment(employee, { ...manager, id: 10 }, []))
      .toThrow("themselves");
    expect(() => validateManagerAssignment(employee, manager, [10]))
      .toThrow("cycle");
  });
});

describe("leave domain rules", () => {
  test("calculates inclusive full-day and half-day requests", () => {
    expect(
      calculateRequestedDays(
        new Date("2026-08-22T00:00:00.000Z"),
        new Date("2026-08-24T00:00:00.000Z"),
        "full_day",
      ),
    ).toBe(3);
    expect(
      calculateRequestedDays(
        new Date("2026-08-22T00:00:00.000Z"),
        new Date("2026-08-22T00:00:00.000Z"),
        "half_day",
      ),
    ).toBe(0.5);
  });

  test("enforces balance, rejection comment, and pending-only cancellation", () => {
    expect(() => assertSufficientLeaveBalance(10, 8, 3)).toThrow("Insufficient");
    expect(() => assertRejectComment("  ")).toThrow("required");
    expect(assertRejectComment(" staffing conflict ")).toBe("staffing conflict");
    expect(() => assertPendingCancellation("approved")).toThrow("Only pending");
  });
});
