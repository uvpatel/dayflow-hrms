import { sql } from "drizzle-orm";
import { z } from "zod";
import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { employees } from "./employees";
import { organizations } from "./organizations";

export const leaveRequests = pgTable(
  "leave_requests",
  {
    id: serial("id").primaryKey(),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "restrict" }),
    organizationId: integer("organization_id").references(
      () => organizations.id,
      { onDelete: "restrict" },
    ),
    leaveType: text("leave_type").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    days: numeric("days", { precision: 7, scale: 2 }).default("1").notNull(),
    unit: text("unit").default("full_day").notNull(),
    reason: text("reason"),
    status: text("status").default("pending").notNull(),
    approvedBy: integer("approved_by").references(() => employees.id, {
      onDelete: "set null",
    }),
    decisionComment: text("decision_comment"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("leave_requests_employee_id_idx").on(table.employeeId),
    index("leave_requests_org_id_idx").on(table.organizationId),
    index("leave_requests_status_idx").on(table.status),
    index("leave_requests_employee_dates_idx").on(
      table.employeeId,
      table.startDate,
      table.endDate,
    ),
    index("leave_requests_org_status_created_idx").on(
      table.organizationId,
      table.status,
      table.createdAt,
    ),
    index("leave_requests_approved_by_idx").on(table.approvedBy),
    check(
      "leave_requests_dates_check",
      sql`${table.endDate} >= ${table.startDate}`,
    ),
    check("leave_requests_days_check", sql`${table.days} > 0`),
    check(
      "leave_requests_unit_check",
      sql`${table.unit} in ('full_day', 'half_day')`,
    ),
    check(
      "leave_requests_status_check",
      sql`${table.status} in ('pending', 'approved', 'rejected', 'cancelled')`,
    ),
    check(
      "leave_requests_rejection_reason_check",
      sql`${table.status} <> 'rejected' or nullif(btrim(${table.rejectionReason}), '') is not null`,
    ),
  ],
);

export const leaveRequestSchema = z.object({
  id: z.number().int().optional(),
  employeeId: z.number().int(),
  organizationId: z.number().int().optional().nullable(),
  leaveType: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  days: z.coerce.number().positive().optional(),
  unit: z.enum(["full_day", "half_day"]).optional(),
  reason: z.string().optional().nullable(),
  status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
  approvedBy: z.number().int().optional().nullable(),
  decisionComment: z.string().optional().nullable(),
  decidedAt: z.date().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type NewLeaveRequest = typeof leaveRequests.$inferInsert;
