import { sql } from "drizzle-orm";
import { z } from "zod";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { employees } from "./employees";
import { organizations } from "./organizations";

export const attendances = pgTable(
  "attendances",
  {
    id: serial("id").primaryKey(),
    // Kept for compatibility and auditing, but authorization is keyed by
    // employeeId resolved from the authenticated session.
    userId: text("user_id").notNull(),
    employeeId: integer("employee_id").references(() => employees.id, {
      onDelete: "restrict",
    }),
    organizationId: integer("organization_id").references(
      () => organizations.id,
      { onDelete: "restrict" },
    ),
    workDate: date("work_date", { mode: "string" }),
    // `date` is the legacy API field. It remains populated while workDate is
    // the canonical local calendar day used by constraints and reporting.
    date: timestamp("date", { withTimezone: true }).notNull(),
    checkInTime: timestamp("check_in_time", { withTimezone: true }),
    checkOutTime: timestamp("check_out_time", { withTimezone: true }),
    workHours: text("work_hours"),
    breakMinutes: integer("break_minutes").default(0).notNull(),
    workMinutes: integer("work_minutes"),
    overtimeMinutes: integer("overtime_minutes").default(0).notNull(),
    scheduledStartMinutes: integer("scheduled_start_minutes"),
    scheduledEndMinutes: integer("scheduled_end_minutes"),
    scheduleTimezone: text("schedule_timezone").default("UTC").notNull(),
    isLate: boolean("is_late").default(false).notNull(),
    status: text("status").default("present").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("attendances_user_id_idx").on(table.userId),
    index("attendances_employee_id_idx").on(table.employeeId),
    index("attendances_org_id_idx").on(table.organizationId),
    index("attendances_date_idx").on(table.date),
    index("attendances_org_work_date_idx").on(
      table.organizationId,
      table.workDate,
    ),
    index("attendances_employee_work_date_idx").on(
      table.employeeId,
      table.workDate,
    ),
    uniqueIndex("attendances_employee_work_date_uidx")
      .on(table.employeeId, table.workDate)
      .where(sql`${table.employeeId} is not null and ${table.workDate} is not null`),
    uniqueIndex("attendances_one_open_per_employee_uidx")
      .on(table.employeeId)
      .where(
        sql`${table.employeeId} is not null and ${table.checkInTime} is not null and ${table.checkOutTime} is null`,
      ),
    check(
      "attendances_checkout_after_checkin_check",
      sql`${table.checkOutTime} is null or (${table.checkInTime} is not null and ${table.checkOutTime} >= ${table.checkInTime})`,
    ),
    check(
      "attendances_duration_nonnegative_check",
      sql`${table.breakMinutes} >= 0 and (${table.workMinutes} is null or ${table.workMinutes} >= 0) and ${table.overtimeMinutes} >= 0`,
    ),
    check(
      "attendances_status_check",
      sql`${table.status} in ('present', 'absent', 'half_day', 'leave', 'holiday')`,
    ),
  ],
);

export const attendanceSchema = z.object({
  id: z.number().int().optional(),
  userId: z.string(),
  employeeId: z.number().int().optional().nullable(),
  organizationId: z.number().int().optional().nullable(),
  workDate: z.string().optional().nullable(),
  date: z.date(),
  checkInTime: z.date().optional().nullable(),
  checkOutTime: z.date().optional().nullable(),
  workHours: z.string().optional().nullable(),
  breakMinutes: z.number().int().min(0).optional(),
  workMinutes: z.number().int().min(0).optional().nullable(),
  overtimeMinutes: z.number().int().min(0).optional(),
  scheduledStartMinutes: z.number().int().min(0).max(1439).optional().nullable(),
  scheduledEndMinutes: z.number().int().min(1).max(1440).optional().nullable(),
  scheduleTimezone: z.string().optional(),
  isLate: z.boolean().optional(),
  status: z.enum(["present", "absent", "half_day", "leave", "holiday"]).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Attendance = typeof attendances.$inferSelect;
export type NewAttendance = typeof attendances.$inferInsert;
