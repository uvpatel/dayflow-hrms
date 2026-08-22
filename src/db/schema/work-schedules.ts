// export src/db/schema/attendance/work-schedules.ts;

import { z } from "zod";
import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { employees } from "./employees";

export const workSchedules = pgTable(
  "work_schedules",
  {
    id: serial("id").primaryKey(),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    scheduleName: text("schedule_name").notNull(),
    timezone: text("timezone").default("UTC").notNull(),
    shiftStartMinutes: integer("shift_start_minutes").default(540).notNull(),
    shiftEndMinutes: integer("shift_end_minutes").default(1020).notNull(),
    breakMinutes: integer("break_minutes").default(0).notNull(),
    fullDayMinutes: integer("full_day_minutes").default(480).notNull(),
    halfDayMinutes: integer("half_day_minutes").default(240).notNull(),
    graceMinutes: integer("grace_minutes").default(0).notNull(),
    weekdays: text("weekdays").default("1,2,3,4,5").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("work_schedules_employee_id_idx").on(table.employeeId),
    index("work_schedules_employee_dates_idx").on(
      table.employeeId,
      table.startDate,
      table.endDate,
    ),
    check(
      "work_schedules_shift_minutes_check",
      sql`${table.shiftStartMinutes} between 0 and 1439 and ${table.shiftEndMinutes} between 1 and 1440 and ${table.shiftEndMinutes} > ${table.shiftStartMinutes}`,
    ),
    check(
      "work_schedules_duration_minutes_check",
      sql`${table.breakMinutes} >= 0 and ${table.halfDayMinutes} > 0 and ${table.fullDayMinutes} >= ${table.halfDayMinutes} and ${table.graceMinutes} >= 0`,
    ),
    check(
      "work_schedules_dates_check",
      sql`${table.endDate} is null or ${table.endDate} >= ${table.startDate}`,
    ),
  ],
);

export const workScheduleSchema = z.object({
  id: z.number().int().optional(),
  employeeId: z.number().int(),
  scheduleName: z.string(),
  timezone: z.string().default("UTC"),
  shiftStartMinutes: z.number().int().min(0).max(1439).default(540),
  shiftEndMinutes: z.number().int().min(1).max(1440).default(1020),
  breakMinutes: z.number().int().min(0).default(0),
  fullDayMinutes: z.number().int().positive().default(480),
  halfDayMinutes: z.number().int().positive().default(240),
  graceMinutes: z.number().int().min(0).default(0),
  weekdays: z.string().default("1,2,3,4,5"),
  startDate: z.date(),
  endDate: z.date().optional().nullable(),
})

export type WorkSchedule = typeof workSchedules.$inferSelect;
