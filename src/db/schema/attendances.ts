import { z } from "zod";
import { pgTable, serial, text, timestamp, integer, index } from "drizzle-orm/pg-core";

export const attendances = pgTable(
  "attendances",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    employeeId: integer("employee_id"),
    organizationId: integer("organization_id"),
    date: timestamp("date").notNull(),
    checkInTime: timestamp("check_in_time"),
    checkOutTime: timestamp("check_out_time"),
    workHours: text("work_hours"),
    status: text("status").default("present").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("attendances_user_id_idx").on(table.userId),
    index("attendances_employee_id_idx").on(table.employeeId),
    index("attendances_org_id_idx").on(table.organizationId),
    index("attendances_date_idx").on(table.date),
  ]
);

export const attendanceSchema = z.object({
  id: z.number().int().optional(),
  userId: z.string(),
  employeeId: z.number().int().optional().nullable(),
  organizationId: z.number().int().optional().nullable(),
  date: z.date(),
  checkInTime: z.date().optional().nullable(),
  checkOutTime: z.date().optional().nullable(),
  workHours: z.string().optional().nullable(),
  status: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Attendance = typeof attendances.$inferSelect;
export type NewAttendance = typeof attendances.$inferInsert;