import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import {
  payrollPeriods,
  salaryStructures,
  salaryComponents,
  payslips,
  payslipItems,
} from "@/db/schema";

export type PayrollPeriod = InferSelectModel<typeof payrollPeriods>;
export type NewPayrollPeriod = InferInsertModel<typeof payrollPeriods>;

export type SalaryStructure = InferSelectModel<typeof salaryStructures>;
export type NewSalaryStructure = InferInsertModel<typeof salaryStructures>;

export type SalaryComponent = InferSelectModel<typeof salaryComponents>;
export type NewSalaryComponent = InferInsertModel<typeof salaryComponents>;

export type Payslip = InferSelectModel<typeof payslips>;
export type NewPayslip = InferInsertModel<typeof payslips>;

export type PayslipItem = InferSelectModel<typeof payslipItems>;
export type NewPayslipItem = InferInsertModel<typeof payslipItems>;
