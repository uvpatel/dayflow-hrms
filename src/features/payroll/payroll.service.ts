import { payrollRepository } from "./payroll.repository";
import { ConflictError, NotFoundError } from "@/lib/api/errors";
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

export class PayrollService {
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
      action: "PAYROLL_PERIOD_CREATED",
      description: `Created payroll period ${created.name}`,
    });

    return created;
  }

  async updatePeriod(organizationId: number, id: number, data: z.infer<typeof updatePayrollPeriodSchema>) {
    const period = await this.getPeriod(organizationId, id);
    if (period.status === "finalized" || period.status === "published") {
      throw new ConflictError("Finalized or published payroll periods are locked", "PAYROLL_ALREADY_FINALIZED");
    }
    const updated = await payrollRepository.updatePeriod(organizationId, id, data);

    await logActivity({
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

    await logActivity({
      action: "PAYROLL_PERIOD_DELETED",
      description: `Deleted payroll period #${id}`,
    });

    return deleted!;
  }

  async calculatePayroll(organizationId: number, id: number) {
    const period = await this.getPeriod(organizationId, id);
    if (period.status === "finalized" || period.status === "published") {
      throw new ConflictError("Finalized or published payroll periods are locked", "PAYROLL_ALREADY_FINALIZED");
    }
    const updated = await payrollRepository.updatePeriod(organizationId, id, {
      status: "review",
    });

    await logActivity({
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
    if (period.status === "finalized" || period.status === "published") {
      throw new ConflictError("Payroll is already finalized", "PAYROLL_ALREADY_FINALIZED");
    }
    const updated = await payrollRepository.updatePeriod(organizationId, id, {
      status: "finalized",
    });

    await logActivity({
      action: "PAYROLL_FINALIZED",
      description: `Finalized payroll for period #${id} (${period.name})`,
    });

    return {
      period: updated,
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
    if (period.status === "finalized" || period.status === "published") {
      throw new ConflictError("Finalized or published payroll periods are locked", "PAYROLL_ALREADY_FINALIZED");
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
      netSalary: data.netSalary,
      status: data.status,
      publishedAt: data.status === "published" ? new Date() : null,
    });

    await logActivity({
      action: "PAYSLIP_CREATED",
      description: `Generated payslip ${created.name}`,
    });

    return created;
  }

  async updatePayslip(organizationId: number, id: number, data: z.infer<typeof updatePayslipSchema>) {
    const payslip = await this.getPayslip(organizationId, id);
    if (payslip.status === "published" || payslip.status === "void") {
      throw new ConflictError("Published or void payslips are locked", "PAYROLL_ALREADY_FINALIZED");
    }
    const updated = await payrollRepository.updatePayslip(organizationId, id, {
      ...data,
      publishedAt: data.status === "published" ? new Date() : payslip.publishedAt,
    });

    await logActivity({
      action: "PAYSLIP_UPDATED",
      description: `Updated payslip #${id}`,
    });

    return updated!;
  }

  async deletePayslip(organizationId: number, id: number) {
    const payslip = await this.getPayslip(organizationId, id);
    if (payslip.status === "published") {
      throw new ConflictError("Published payslips cannot be deleted", "PAYROLL_ALREADY_FINALIZED");
    }
    const deleted = await payrollRepository.deletePayslip(organizationId, id);

    await logActivity({
      action: "PAYSLIP_DELETED",
      description: `Deleted payslip #${id}`,
    });

    return deleted!;
  }
}

export const payrollService = new PayrollService();
