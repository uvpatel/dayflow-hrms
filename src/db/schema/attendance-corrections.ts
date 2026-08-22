import { sql } from "drizzle-orm";
import { z } from "zod";
import {
  check,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { attendances } from "./attendances";
import { employees } from "./employees";
import { organizations } from "./organizations";

export const attendanceCorrections = pgTable(
  "attendance_corrections",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    employeeId: integer("employee_id").references(() => employees.id, {
      onDelete: "restrict",
    }),
    organizationId: integer("organization_id").references(
      () => organizations.id,
      { onDelete: "restrict" },
    ),
    attendanceId: integer("attendance_id").references(() => attendances.id, {
      onDelete: "set null",
    }),
    correctionDate: timestamp("correction_date", { withTimezone: true }).notNull(),
    requestedCheckInTime: timestamp("requested_check_in_time", {
      withTimezone: true,
    }),
    requestedCheckOutTime: timestamp("requested_check_out_time", {
      withTimezone: true,
    }),
    reason: text("reason").notNull(),
    status: text("status").default("pending").notNull(),
    reviewedBy: integer("reviewed_by").references(() => employees.id, {
      onDelete: "set null",
    }),
    reviewComment: text("review_comment"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("attendance_corrections_user_id_idx").on(table.userId),
    index("attendance_corrections_employee_id_idx").on(table.employeeId),
    index("attendance_corrections_org_status_idx").on(
      table.organizationId,
      table.status,
    ),
    index("attendance_corrections_attendance_id_idx").on(table.attendanceId),
    index("attendance_corrections_reviewed_by_idx").on(table.reviewedBy),
    check(
      "attendance_corrections_status_check",
      sql`${table.status} in ('pending', 'approved', 'rejected', 'cancelled')`,
    ),
    check(
      "attendance_corrections_requested_times_check",
      sql`${table.requestedCheckOutTime} is null or (${table.requestedCheckInTime} is not null and ${table.requestedCheckOutTime} >= ${table.requestedCheckInTime})`,
    ),
  ],
);

export const attendanceCorrectionSchema = z.object({
  id: z.number().int().optional(),
  userId: z.string(),
  employeeId: z.number().int().optional().nullable(),
  organizationId: z.number().int().optional().nullable(),
  attendanceId: z.number().int().optional().nullable(),
  correctionDate: z.date(),
  requestedCheckInTime: z.date().optional().nullable(),
  requestedCheckOutTime: z.date().optional().nullable(),
  reason: z.string(),
  status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
  reviewedBy: z.number().int().optional().nullable(),
  reviewComment: z.string().optional().nullable(),
  reviewedAt: z.date().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type AttendanceCorrection = typeof attendanceCorrections.$inferSelect;
export type NewAttendanceCorrection = typeof attendanceCorrections.$inferInsert;
