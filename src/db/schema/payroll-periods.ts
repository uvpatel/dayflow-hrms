import { z } from "zod";
import { pgTable, serial, text, timestamp, integer, index } from "drizzle-orm/pg-core";

export const payrollPeriods = pgTable(
  "payroll_periods",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id"),
    name: text("name").notNull(),
    description: text("description"),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    status: text("status").default("draft").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("payroll_periods_org_id_idx").on(table.organizationId),
  ]
);

export const payrollPeriodSchema = z.object({
  id: z.number().int().optional(),
  organizationId: z.number().int().optional().nullable(),
  name: z.string(),
  description: z.string().optional().nullable(),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  status: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type PayrollPeriod = typeof payrollPeriods.$inferSelect;
export type NewPayrollPeriod = typeof payrollPeriods.$inferInsert;
