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
import { organizations } from "./organizations";
import { payrollPeriods } from "./payroll-periods";

export const payslips = pgTable(
  "payslips",
  {
    id: serial("id").primaryKey(),
    name: text("name"),
    description: text("description"),
    employeeId: integer("employee_id").references(() => employees.id, {
      onDelete: "restrict",
    }),
    organizationId: integer("organization_id").references(
      () => organizations.id,
      { onDelete: "restrict" },
    ),
    payrollPeriodId: integer("payroll_period_id").references(
      () => payrollPeriods.id,
      { onDelete: "restrict" },
    ),
    month: text("month"),
    year: integer("year"),
    basicSalary: numeric("basic_salary", { precision: 14, scale: 2 }),
    grossSalary: numeric("gross_salary", { precision: 14, scale: 2 }),
    deductions: numeric("deductions", { precision: 14, scale: 2 }).default("0"),
    netSalary: numeric("net_salary", { precision: 14, scale: 2 }),
    status: text("status").default("draft").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("payslips_employee_id_idx").on(table.employeeId),
    index("payslips_org_id_idx").on(table.organizationId),
    index("payslips_payroll_period_id_idx").on(table.payrollPeriodId),
    index("payslips_org_status_idx").on(table.organizationId, table.status),
    uniqueIndex("payslips_employee_period_uidx")
      .on(table.employeeId, table.payrollPeriodId)
      .where(
        sql`${table.employeeId} is not null and ${table.payrollPeriodId} is not null`,
      ),
    check(
      "payslips_status_check",
      sql`${table.status} in ('draft', 'calculated', 'reviewed', 'published', 'void')`,
    ),
    check(
      "payslips_money_nonnegative_check",
      sql`(${table.basicSalary} is null or ${table.basicSalary} >= 0) and (${table.grossSalary} is null or ${table.grossSalary} >= 0) and (${table.deductions} is null or ${table.deductions} >= 0) and (${table.netSalary} is null or ${table.netSalary} >= 0)`,
    ),
  ],
);

export const payslipSchema = z.object({
  id: z.number().int().optional(),
  name: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  employeeId: z.number().int().optional().nullable(),
  organizationId: z.number().int().optional().nullable(),
  payrollPeriodId: z.number().int().optional().nullable(),
  month: z.string().optional().nullable(),
  year: z.number().int().optional().nullable(),
  basicSalary: z.string().optional().nullable(),
  grossSalary: z.string().optional().nullable(),
  deductions: z.string().optional().nullable(),
  netSalary: z.string().optional().nullable(),
  status: z.enum(["draft", "calculated", "reviewed", "published", "void"]).optional(),
  publishedAt: z.date().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Payslip = typeof payslips.$inferSelect;
export type NewPayslip = typeof payslips.$inferInsert;
