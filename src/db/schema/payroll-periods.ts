import { z } from "zod";
import { sql } from "drizzle-orm";
import { check, pgTable, serial, text, timestamp, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const payrollPeriods = pgTable(
  "payroll_periods",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").references(() => organizations.id, {
      onDelete: "restrict",
    }),
    name: text("name").notNull(),
    description: text("description"),
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
    status: text("status").default("draft").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("payroll_periods_org_id_idx").on(table.organizationId),
    uniqueIndex("payroll_periods_org_dates_uidx")
      .on(table.organizationId, table.startDate, table.endDate)
      .where(sql`${table.organizationId} is not null and ${table.startDate} is not null and ${table.endDate} is not null`),
    check(
      "payroll_periods_dates_check",
      sql`${table.startDate} is null or ${table.endDate} is null or ${table.endDate} >= ${table.startDate}`,
    ),
    check(
      "payroll_periods_status_check",
      sql`${table.status} in ('draft', 'calculating', 'review', 'finalized', 'published')`,
    ),
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
