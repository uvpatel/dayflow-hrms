import { z } from "zod";
import { pgTable, serial, text, timestamp, integer, index } from "drizzle-orm/pg-core";

export const payslips = pgTable(
  "payslips",
  {
    id: serial("id").primaryKey(),
    name: text("name"),
    description: text("description"),
    employeeId: integer("employee_id"),
    organizationId: integer("organization_id"),
    month: text("month"),
    year: integer("year"),
    basicSalary: text("basic_salary"),
    netSalary: text("net_salary"),
    status: text("status").default("draft").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("payslips_employee_id_idx").on(table.employeeId),
    index("payslips_org_id_idx").on(table.organizationId),
  ]
);

export const payslipSchema = z.object({
  id: z.number().int().optional(),
  name: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  employeeId: z.number().int().optional().nullable(),
  organizationId: z.number().int().optional().nullable(),
  month: z.string().optional().nullable(),
  year: z.number().int().optional().nullable(),
  basicSalary: z.string().optional().nullable(),
  netSalary: z.string().optional().nullable(),
  status: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Payslip = typeof payslips.$inferSelect;
export type NewPayslip = typeof payslips.$inferInsert;
