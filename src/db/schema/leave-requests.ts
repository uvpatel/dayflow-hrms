import { z } from "zod";
import { pgTable, serial, text, timestamp, integer, index } from "drizzle-orm/pg-core";

export const leaveRequests = pgTable(
  "leave_requests",
  {
    id: serial("id").primaryKey(),
    employeeId: integer("employee_id").notNull(),
    organizationId: integer("organization_id"),
    leaveType: text("leave_type").notNull(),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    days: integer("days").default(1),
    reason: text("reason"),
    status: text("status").default("pending").notNull(), // pending | approved | rejected | cancelled
    approvedBy: integer("approved_by"),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("leave_requests_employee_id_idx").on(table.employeeId),
    index("leave_requests_org_id_idx").on(table.organizationId),
    index("leave_requests_status_idx").on(table.status),
  ]
);

export const leaveRequestSchema = z.object({
  id: z.number().int().optional(),
  employeeId: z.number().int(),
  organizationId: z.number().int().optional().nullable(),
  leaveType: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  days: z.number().optional().nullable(),
  reason: z.string().optional().nullable(),
  status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
  approvedBy: z.number().int().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type NewLeaveRequest = typeof leaveRequests.$inferInsert;
