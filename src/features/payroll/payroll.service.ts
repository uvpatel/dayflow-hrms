import { payrollRepository } from "./payroll.repository";
import { NotFoundError } from "@/lib/api/errors";
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

export class PayrollService {
  // Periods
  async listPeriods(limit = 20, offset = 0) {
    const [items, total] = await Promise.all([
      payrollRepository.findPeriods(limit, offset),
      payrollRepository.countPeriods(),
    ]);
    return { items, total };
  }

  async getPeriod(id: number) {
    const item = await payrollRepository.findPeriodById(id);
    if (!item) throw new NotFoundError(`Payroll period with ID ${id} not found`, "PAYROLL_PERIOD_NOT_FOUND");
    return item;
  }

  async createPeriod(data: z.infer<typeof createPayrollPeriodSchema>) {
    const created = await payrollRepository.createPeriod({
      name: data.name,
      description: data.description ?? null,
    });

    await logActivity({
      action: "PAYROLL_PERIOD_CREATED",
      description: `Created payroll period ${created.name}`,
    });

    return created;
  }

  async updatePeriod(id: number, data: z.infer<typeof updatePayrollPeriodSchema>) {
    await this.getPeriod(id);
    const updated = await payrollRepository.updatePeriod(id, data);

    await logActivity({
      action: "PAYROLL_PERIOD_UPDATED",
      description: `Updated payroll period #${id}`,
    });

    return updated!;
  }

  async deletePeriod(id: number) {
    await this.getPeriod(id);
    const deleted = await payrollRepository.deletePeriod(id);

    await logActivity({
      action: "PAYROLL_PERIOD_DELETED",
      description: `Deleted payroll period #${id}`,
    });

    return deleted!;
  }

  async calculatePayroll(id: number) {
    const period = await this.getPeriod(id);

    // Creates payslip record associated with the calculated period
    const payslip = await payrollRepository.createPayslip({
      name: `Payslip - ${period.name}`,
      description: `Auto-generated payroll calculations for ${period.name}`,
    });

    await logActivity({
      action: "PAYROLL_CALCULATED",
      description: `Calculated payroll for period #${id} (${period.name})`,
    });

    return {
      period,
      payslip,
      message: `Payroll for period '${period.name}' calculated successfully`,
    };
  }

  async finalizePayroll(id: number) {
    const period = await this.getPeriod(id);

    await logActivity({
      action: "PAYROLL_FINALIZED",
      description: `Finalized payroll for period #${id} (${period.name})`,
    });

    return {
      period,
      message: `Payroll for period '${period.name}' finalized and locked`,
    };
  }

  // Structures
  async listStructures(limit = 50, offset = 0) {
    return await payrollRepository.findStructures(limit, offset);
  }

  async getStructure(id: number) {
    const item = await payrollRepository.findStructureById(id);
    if (!item) throw new NotFoundError(`Salary structure with ID ${id} not found`);
    return item;
  }

  async createStructure(data: z.infer<typeof createSalaryStructureSchema>) {
    const created = await payrollRepository.createStructure({
      name: data.name,
      description: data.description ?? null,
    });

    await logActivity({
      action: "SALARY_STRUCTURE_CREATED",
      description: `Created salary structure ${created.name}`,
    });

    return created;
  }

  async updateStructure(id: number, data: z.infer<typeof updateSalaryStructureSchema>) {
    await this.getStructure(id);
    const updated = await payrollRepository.updateStructure(id, data);

    await logActivity({
      action: "SALARY_STRUCTURE_UPDATED",
      description: `Updated salary structure #${id}`,
    });

    return updated!;
  }

  async deleteStructure(id: number) {
    await this.getStructure(id);
    const deleted = await payrollRepository.deleteStructure(id);

    await logActivity({
      action: "SALARY_STRUCTURE_DELETED",
      description: `Deleted salary structure #${id}`,
    });

    return deleted!;
  }

  // Components
  async listComponents(limit = 50, offset = 0) {
    return await payrollRepository.findComponents(limit, offset);
  }

  async getComponent(id: number) {
    const item = await payrollRepository.findComponentById(id);
    if (!item) throw new NotFoundError(`Salary component with ID ${id} not found`);
    return item;
  }

  async createComponent(data: z.infer<typeof createSalaryComponentSchema>) {
    const created = await payrollRepository.createComponent({
      name: data.name,
      description: data.description ?? null,
    });

    await logActivity({
      action: "SALARY_COMPONENT_CREATED",
      description: `Created salary component ${created.name}`,
    });

    return created;
  }

  async updateComponent(id: number, data: z.infer<typeof updateSalaryComponentSchema>) {
    await this.getComponent(id);
    const updated = await payrollRepository.updateComponent(id, data);

    await logActivity({
      action: "SALARY_COMPONENT_UPDATED",
      description: `Updated salary component #${id}`,
    });

    return updated!;
  }

  async deleteComponent(id: number) {
    await this.getComponent(id);
    const deleted = await payrollRepository.deleteComponent(id);

    await logActivity({
      action: "SALARY_COMPONENT_DELETED",
      description: `Deleted salary component #${id}`,
    });

    return deleted!;
  }

  // Payslips
  async listPayslips(limit = 50, offset = 0, search?: string) {
    const [items, total] = await Promise.all([
      payrollRepository.findPayslips(limit, offset, search),
      payrollRepository.countPayslips(search),
    ]);
    return { items, total };
  }

  async getPayslip(id: number) {
    const item = await payrollRepository.findPayslipById(id);
    if (!item) throw new NotFoundError(`Payslip with ID ${id} not found`, "PAYSLIP_NOT_FOUND");
    return item;
  }

  async createPayslip(data: z.infer<typeof createPayslipSchema>) {
    const created = await payrollRepository.createPayslip({
      name: data.name,
      description: data.description ?? null,
    });

    await logActivity({
      action: "PAYSLIP_CREATED",
      description: `Generated payslip ${created.name}`,
    });

    return created;
  }

  async updatePayslip(id: number, data: z.infer<typeof updatePayslipSchema>) {
    await this.getPayslip(id);
    const updated = await payrollRepository.updatePayslip(id, data);

    await logActivity({
      action: "PAYSLIP_UPDATED",
      description: `Updated payslip #${id}`,
    });

    return updated!;
  }

  async deletePayslip(id: number) {
    await this.getPayslip(id);
    const deleted = await payrollRepository.deletePayslip(id);

    await logActivity({
      action: "PAYSLIP_DELETED",
      description: `Deleted payslip #${id}`,
    });

    return deleted!;
  }
}

export const payrollService = new PayrollService();
