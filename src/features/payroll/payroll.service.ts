import { payrollRepository } from "./payroll.repository";
import {
  BusinessRuleError,
  ConflictError,
  NotFoundError,
} from "@/lib/api/errors";
import { employeeRepository } from "@/features/employees/employee.repository";
import { logActivity } from "@/lib/audit/logger";
import { z } from "zod";
import {
  createPayrollPeriodSchema,
  updatePayrollPeriodSchema,
  createSalaryStructureSchema,
  updateSalaryStructureSchema,
  createSalaryComponentSchema,
  updateSalaryComponentSchema,
  createPayslipSchema,
  updatePayslipSchema,
} from "./payroll.schemas";
import { calculateNetSalary } from "./payroll.domain";

export class PayrollService {
  private async assertPeriodStillInState(
    organizationId: number,
    id: number,
    expectedStatus: string,
  ) {
    const latest = await payrollRepository.findPeriodById(organizationId, id);
    if (!latest || latest.status !== expectedStatus) {
      throw new ConflictError(
        "Payroll period state changed while the operation was in progress",
        "PAYROLL_ALREADY_FINALIZED",
      );
    }
  }

  // Periods
  async listPeriods(organizationId: number, limit = 20, offset = 0) {
    const [items, total] = await Promise.all([
      payrollRepository.findPeriods(organizationId, limit, offset),
      payrollRepository.countPeriods(organizationId),
    ]);
    return { items, total };
  }

  async getPeriod(organizationId: number, id: number) {
    const item = await payrollRepository.findPeriodById(organizationId, id);
    if (!item) throw new NotFoundError(`Payroll period with ID ${id} not found`, "PAYROLL_PERIOD_NOT_FOUND");
    return item;
  }

  async createPeriod(organizationId: number, data: z.infer<typeof createPayrollPeriodSchema>) {
    const created = await payrollRepository.createPeriod({
      organizationId,
      name: data.name,
      description: data.description ?? null,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
    });

    await logActivity({
      organizationId,
      action: "PAYROLL_PERIOD_CREATED",
      description: `Created payroll period ${created.name}`,
    });

    return created;
  }

  async updatePeriod(organizationId: number, id: number, data: z.infer<typeof updatePayrollPeriodSchema>) {
    const period = await this.getPeriod(organizationId, id);
    if (period.status !== "draft") {
      throw new ConflictError("Only draft payroll periods can be updated", "PAYROLL_ALREADY_FINALIZED");
    }
    const startDate = data.startDate === undefined ? period.startDate : data.startDate;
    const endDate = data.endDate === undefined ? period.endDate : data.endDate;
    if (startDate && endDate && endDate < startDate) {
      throw new BusinessRuleError(
        "Payroll period end date cannot precede its start date",
      );
    }
    const updated = await payrollRepository.updatePeriod(organizationId, id, data);
    if (!updated) {
      throw new ConflictError(
        "Payroll period left draft state before the update completed",
        "PAYROLL_ALREADY_FINALIZED",
      );
    }

    await logActivity({
      organizationId,
      action: "PAYROLL_PERIOD_UPDATED",
      description: `Updated payroll period #${id}`,
    });

    return updated!;
  }

  async deletePeriod(organizationId: number, id: number) {
    const period = await this.getPeriod(organizationId, id);
    if (period.status !== "draft") {
      throw new ConflictError("Only draft payroll periods can be deleted", "PAYROLL_ALREADY_FINALIZED");
    }
    const deleted = await payrollRepository.deletePeriod(organizationId, id);
    if (!deleted) {
      throw new ConflictError(
        "Payroll period left draft state before deletion completed",
        "PAYROLL_ALREADY_FINALIZED",
      );
    }

    await logActivity({
      organizationId,
      action: "PAYROLL_PERIOD_DELETED",
      description: `Deleted payroll period #${id}`,
    });

    return period;
  }

  async calculatePayroll(organizationId: number, id: number) {
    const period = await this.getPeriod(organizationId, id);
    if (period.status !== "draft") {
      throw new ConflictError(
        `Only draft payroll can be calculated; this period is '${period.status}'`,
        "PAYROLL_ALREADY_FINALIZED",
      );
    }
    const updated = await payrollRepository.calculatePeriod(organizationId, id);
    if (!updated) {
      await this.assertPeriodStillInState(organizationId, id, "draft");
      throw new BusinessRuleError(
        "Payroll needs at least one valid payslip and deductions cannot exceed gross salary",
      );
    }

    await logActivity({
      organizationId,
      action: "PAYROLL_CALCULATED",
      description: `Calculated payroll for period #${id} (${period.name})`,
    });

    return {
      period: updated,
      message: `Payroll period '${period.name}' is ready for payslip review`,
    };
  }

  async finalizePayroll(organizationId: number, id: number) {
    const period = await this.getPeriod(organizationId, id);
    if (period.status !== "review") {
      throw new ConflictError(
        `Only reviewed payroll can be finalized; this period is '${period.status}'`,
        "PAYROLL_ALREADY_FINALIZED",
      );
    }
    const updated = await payrollRepository.finalizePeriod(organizationId, id);
    if (!updated) {
      await this.assertPeriodStillInState(organizationId, id, "review");
      throw new BusinessRuleError(
        "All payslips must be calculated and internally consistent before finalization",
      );
    }

    await logActivity({
      organizationId,
      action: "PAYROLL_FINALIZED",
      description: `Finalized payroll for period #${id} (${period.name})`,
    });

    return {
      period: updated,
      message: `Payroll for period '${period.name}' finalized and locked`,
    };
  }

  async publishPayroll(organizationId: number, id: number) {
    const period = await this.getPeriod(organizationId, id);
    if (period.status !== "finalized") {
      throw new ConflictError(
        `Only finalized payroll can be published; this period is '${period.status}'`,
        "PAYROLL_ALREADY_FINALIZED",
      );
    }
    const updated = await payrollRepository.publishPeriod(organizationId, id);
    if (!updated) {
      await this.assertPeriodStillInState(organizationId, id, "finalized");
      throw new BusinessRuleError(
        "Every payslip must be reviewed before the period can be published",
      );
    }

    await logActivity({
      organizationId,
      action: "PAYROLL_PUBLISHED",
      description: `Published payroll period #${id} (${period.name})`,
    });

    return {
      period: updated,
      message: `Payroll for period '${period.name}' published to employees`,
    };
  }

  // Structures
  async listStructures(organizationId: number, limit = 50, offset = 0) {
    return await payrollRepository.findStructures(organizationId, limit, offset);
  }

  async getStructure(organizationId: number, id: number) {
    const item = await payrollRepository.findStructureById(organizationId, id);
    if (!item) throw new NotFoundError(`Salary structure with ID ${id} not found`);
    return item;
  }

  async createStructure(organizationId: number, data: z.infer<typeof createSalaryStructureSchema>) {
    const created = await payrollRepository.createStructure({
      organizationId,
      name: data.name,
      description: data.description ?? null,
    });

    await logActivity({
      organizationId,
      action: "SALARY_STRUCTURE_CREATED",
      description: `Created salary structure ${created.name}`,
    });

    return created;
  }

  async updateStructure(organizationId: number, id: number, data: z.infer<typeof updateSalaryStructureSchema>) {
    await this.getStructure(organizationId, id);
    const updated = await payrollRepository.updateStructure(organizationId, id, data);

    await logActivity({
      organizationId,
      action: "SALARY_STRUCTURE_UPDATED",
      description: `Updated salary structure #${id}`,
    });

    return updated!;
  }

  async deleteStructure(organizationId: number, id: number) {
    await this.getStructure(organizationId, id);
    const deleted = await payrollRepository.deleteStructure(organizationId, id);

    await logActivity({
      organizationId,
      action: "SALARY_STRUCTURE_DELETED",
      description: `Deleted salary structure #${id}`,
    });

    return deleted!;
  }

  // Components
  async listComponents(organizationId: number, limit = 50, offset = 0) {
    return await payrollRepository.findComponents(organizationId, limit, offset);
  }

  async getComponent(organizationId: number, id: number) {
    const item = await payrollRepository.findComponentById(organizationId, id);
    if (!item) throw new NotFoundError(`Salary component with ID ${id} not found`);
    return item;
  }

  async createComponent(organizationId: number, data: z.infer<typeof createSalaryComponentSchema>) {
    const created = await payrollRepository.createComponent({
      organizationId,
      name: data.name,
      description: data.description ?? null,
    });

    await logActivity({
      organizationId,
      action: "SALARY_COMPONENT_CREATED",
      description: `Created salary component ${created.name}`,
    });

    return created;
  }

  async updateComponent(organizationId: number, id: number, data: z.infer<typeof updateSalaryComponentSchema>) {
    await this.getComponent(organizationId, id);
    const updated = await payrollRepository.updateComponent(organizationId, id, data);

    await logActivity({
      organizationId,
      action: "SALARY_COMPONENT_UPDATED",
      description: `Updated salary component #${id}`,
    });

    return updated!;
  }

  async deleteComponent(organizationId: number, id: number) {
    await this.getComponent(organizationId, id);
    const deleted = await payrollRepository.deleteComponent(organizationId, id);

    await logActivity({
      organizationId,
      action: "SALARY_COMPONENT_DELETED",
      description: `Deleted salary component #${id}`,
    });

    return deleted!;
  }

  // Payslips
  async listPayslips(organizationId: number, limit = 50, offset = 0, search?: string) {
    const [items, total] = await Promise.all([
      payrollRepository.findPayslips(organizationId, limit, offset, search),
      payrollRepository.countPayslips(organizationId, search),
    ]);
    return { items, total };
  }

  async getPayslip(organizationId: number, id: number) {
    const item = await payrollRepository.findPayslipById(organizationId, id);
    if (!item) throw new NotFoundError(`Payslip with ID ${id} not found`, "PAYSLIP_NOT_FOUND");
    return item;
  }

  async createPayslip(organizationId: number, data: z.infer<typeof createPayslipSchema>) {
    const [employee, period] = await Promise.all([
      employeeRepository.findEmployeeById(data.employeeId),
      this.getPeriod(organizationId, data.payrollPeriodId),
    ]);
    if (!employee || employee.organizationId !== organizationId) {
      throw new NotFoundError("Employee not found", "EMPLOYEE_NOT_FOUND");
    }
    if (period.status !== "draft") {
      throw new ConflictError(
        "Payslips can only be added while the payroll period is in draft",
        "PAYROLL_ALREADY_FINALIZED",
      );
    }
    let netSalary: string;
    try {
      netSalary = calculateNetSalary(data.grossSalary, data.deductions);
    } catch (error) {
      throw new BusinessRuleError(
        error instanceof Error ? error.message : "Invalid payroll amounts",
      );
    }
    const created = await payrollRepository.createPayslip({
      organizationId,
      employeeId: data.employeeId,
      payrollPeriodId: data.payrollPeriodId,
      name: data.name ?? `Payslip - ${period.name}`,
      description: data.description ?? null,
      month: data.month ?? null,
      year: data.year ?? null,
      basicSalary: data.basicSalary ?? null,
      grossSalary: data.grossSalary,
      deductions: data.deductions,
      netSalary,
    });
    if (!created) {
      throw new ConflictError(
        "Payroll period or employee changed before the payslip could be created",
        "PAYROLL_ALREADY_FINALIZED",
      );
    }

    await logActivity({
      organizationId,
      action: "PAYSLIP_CREATED",
      description: `Generated payslip ${created.name}`,
    });

    return created;
  }

  async updatePayslip(organizationId: number, id: number, data: z.infer<typeof updatePayslipSchema>) {
    const payslip = await this.getPayslip(organizationId, id);
    if (payslip.payrollPeriodId == null) {
      throw new BusinessRuleError("Payslip is not linked to a payroll period");
    }
    const period = await this.getPeriod(organizationId, payslip.payrollPeriodId);
    if (period.status !== "draft" || payslip.status !== "draft") {
      throw new ConflictError(
        "Only draft payslips in a draft period can be changed",
        "PAYROLL_ALREADY_FINALIZED",
      );
    }
    const grossSalary = data.grossSalary ?? payslip.grossSalary;
    const deductions = data.deductions ?? payslip.deductions ?? "0";
    if (!grossSalary) {
      throw new BusinessRuleError("Gross salary is required");
    }
    let netSalary: string;
    try {
      netSalary = calculateNetSalary(grossSalary, deductions);
    } catch (error) {
      throw new BusinessRuleError(
        error instanceof Error ? error.message : "Invalid payroll amounts",
      );
    }
    const updated = await payrollRepository.updatePayslip(organizationId, id, {
      name: data.name ?? payslip.name,
      description: data.description ?? payslip.description,
      month: data.month ?? payslip.month,
      year: data.year ?? payslip.year,
      basicSalary: data.basicSalary ?? payslip.basicSalary,
      grossSalary,
      deductions,
      netSalary,
    });
    if (!updated) {
      throw new ConflictError(
        "Payslip or payroll period left draft state before the update completed",
        "PAYROLL_ALREADY_FINALIZED",
      );
    }

    await logActivity({
      organizationId,
      action: "PAYSLIP_UPDATED",
      description: `Updated payslip #${id}`,
    });

    return updated!;
  }

  async deletePayslip(organizationId: number, id: number) {
    const payslip = await this.getPayslip(organizationId, id);
    if (payslip.payrollPeriodId == null) {
      throw new BusinessRuleError("Payslip is not linked to a payroll period");
    }
    const period = await this.getPeriod(organizationId, payslip.payrollPeriodId);
    if (period.status !== "draft" || payslip.status !== "draft") {
      throw new ConflictError(
        "Only draft payslips in a draft period can be deleted",
        "PAYROLL_ALREADY_FINALIZED",
      );
    }
    const deleted = await payrollRepository.deletePayslip(organizationId, id);
    if (!deleted) {
      throw new ConflictError(
        "Payslip or payroll period left draft state before deletion completed",
        "PAYROLL_ALREADY_FINALIZED",
      );
    }

    await logActivity({
      organizationId,
      action: "PAYSLIP_DELETED",
      description: `Deleted payslip #${id}`,
    });

    return payslip;
  }
}

export const payrollService = new PayrollService();
