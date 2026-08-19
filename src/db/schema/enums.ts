// src/db/schema/enums.ts

import { pgEnum } from "drizzle-orm/pg-core"

export const employeeStatusEnum = pgEnum(
  "employee_status",
  [
    "onboarding",
    "active",
    "notice_period",
    "inactive",
  ]
)

export const employmentTypeEnum = pgEnum(
  "employment_type",
  [
    "full_time",
    "part_time",
    "contract",
    "intern",
  ]
)

export const attendanceStatusEnum = pgEnum(
  "attendance_status",
  [
    "present",
    "absent",
    "half_day",
    "leave",
    "holiday",
  ]
)

export const leaveRequestStatusEnum = pgEnum(
  "leave_request_status",
  [
    "pending",
    "approved",
    "rejected",
    "cancelled",
  ]
)

export const leaveUnitEnum = pgEnum(
  "leave_unit",
  [
    "full_day",
    "half_day",
  ]
)