import { z } from "zod";

// Payroll Period
export const createPayrollPeriodSchema = z.object({
  name: z.string().min(2, "Period name must be at least 2 characters"),
  description: z.string().optional(),
});

export const updatePayrollPeriodSchema = createPayrollPeriodSchema.partial();

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
  name: z.string().min(2, "Payslip name must be at least 2 characters"),
  description: z.string().optional(),
});

export const updatePayslipSchema = createPayslipSchema.partial();
