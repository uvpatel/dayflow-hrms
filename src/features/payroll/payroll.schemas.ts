import { z } from "zod";

// Payroll Period
export const createPayrollPeriodSchema = z.object({
  name: z.string().min(2, "Period name must be at least 2 characters"),
  description: z.string().optional(),
  startDate: z.string().or(z.date()).transform((value) => new Date(value)).optional(),
  endDate: z.string().or(z.date()).transform((value) => new Date(value)).optional(),
}).strict().refine(
  (value) => !value.startDate || !value.endDate || value.endDate >= value.startDate,
  { message: "Payroll period end date cannot precede its start date", path: ["endDate"] },
);

export const updatePayrollPeriodSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  startDate: z.string().or(z.date()).transform((value) => new Date(value)).nullable().optional(),
  endDate: z.string().or(z.date()).transform((value) => new Date(value)).nullable().optional(),
}).strict();

// Salary Structure
export const createSalaryStructureSchema = z.object({
  name: z.string().min(2, "Structure name must be at least 2 characters"),
  description: z.string().optional(),
});

export const updateSalaryStructureSchema = createSalaryStructureSchema.partial();

// Salary Component
export const createSalaryComponentSchema = z.object({
  name: z.string().min(2, "Component name must be at least 2 characters"),
  description: z.string().optional(),
});

export const updateSalaryComponentSchema = createSalaryComponentSchema.partial();

// Payslip
export const createPayslipSchema = z.object({
  name: z.string().min(2, "Payslip name must be at least 2 characters").optional(),
  description: z.string().optional(),
  employeeId: z.number().int().positive(),
  payrollPeriodId: z.number().int().positive(),
  month: z.string().min(1).optional(),
  year: z.number().int().min(2000).max(9999).optional(),
  basicSalary: z.string().regex(/^\d+(?:\.\d{1,2})?$/).optional(),
  grossSalary: z.string().regex(/^\d+(?:\.\d{1,2})?$/),
  deductions: z.string().regex(/^\d+(?:\.\d{1,2})?$/).default("0"),
}).strict();

export const updatePayslipSchema = createPayslipSchema
  .omit({ employeeId: true, payrollPeriodId: true })
  .partial();
