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
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { employees } from "./employees";

export const leaveAllocations = pgTable(
  "leave_allocations",
  {
    id: serial("id").primaryKey(),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "restrict" }),
    leaveType: text("leave_type").notNull(),
    allocatedDays: numeric("allocated_days", { precision: 7, scale: 2 })
      .notNull(),
    usedDays: numeric("used_days", { precision: 7, scale: 2 })
      .default("0")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("leave_allocations_employee_type_uidx").on(
      table.employeeId,
      table.leaveType,
    ),
    index("leave_allocations_employee_id_idx").on(table.employeeId),
    check(
      "leave_allocations_values_check",
      sql`${table.allocatedDays} >= 0 and ${table.usedDays} >= 0 and ${table.usedDays} <= ${table.allocatedDays}`,
    ),
  ],
);

export type LeaveAllocation = typeof leaveAllocations.$inferSelect;
export type NewLeaveAllocation = typeof leaveAllocations.$inferInsert;

export const leaveAllocationSchema = z.object({
  id: z.number().int().optional(),
  employeeId: z.number().int(),
  leaveType: z.string(),
  allocatedDays: z.coerce.number().nonnegative(),
  usedDays: z.coerce.number().nonnegative().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
