import { db } from "@/db";
import {
  payrollPeriods,
  salaryStructures,
  salaryComponents,
  payslips,
} from "@/db/schema";
import { and, count, desc, eq, ilike } from "drizzle-orm";
import {
  NewPayrollPeriod,
  NewSalaryStructure,
  NewSalaryComponent,
  NewPayslip,
} from "./payroll.types";

export class PayrollRepository {
  // Periods
  async findPeriods(organizationId: number, limit = 20, offset = 0) {
    return await db
      .select()
      .from(payrollPeriods)
      .where(eq(payrollPeriods.organizationId, organizationId))
      .orderBy(desc(payrollPeriods.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async countPeriods(organizationId: number): Promise<number> {
    const [res] = await db
      .select({ total: count() })
      .from(payrollPeriods)
      .where(eq(payrollPeriods.organizationId, organizationId));
    return res?.total ?? 0;
  }

  async findPeriodById(organizationId: number, id: number) {
    const [item] = await db.select().from(payrollPeriods).where(and(
      eq(payrollPeriods.id, id),
      eq(payrollPeriods.organizationId, organizationId),
    ));
    return item ?? null;
  }

  async createPeriod(data: NewPayrollPeriod) {
    const [created] = await db.insert(payrollPeriods).values(data).returning();
    return created;
  }

  async updatePeriod(organizationId: number, id: number, data: Partial<NewPayrollPeriod>) {
    const [updated] = await db
      .update(payrollPeriods)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(payrollPeriods.id, id),
        eq(payrollPeriods.organizationId, organizationId),
      ))
      .returning();
    return updated ?? null;
  }

  async deletePeriod(organizationId: number, id: number) {
    const [deleted] = await db.delete(payrollPeriods).where(and(
      eq(payrollPeriods.id, id),
      eq(payrollPeriods.organizationId, organizationId),
    )).returning();
    return deleted ?? null;
  }

  // Structures
  async findStructures(limit = 50, offset = 0) {
    return await db
      .select()
      .from(salaryStructures)
      .orderBy(desc(salaryStructures.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findStructureById(id: number) {
    const [item] = await db.select().from(salaryStructures).where(eq(salaryStructures.id, id));
    return item ?? null;
  }

  async createStructure(data: NewSalaryStructure) {
    const [created] = await db.insert(salaryStructures).values(data).returning();
    return created;
  }

  async updateStructure(id: number, data: Partial<NewSalaryStructure>) {
    const [updated] = await db
      .update(salaryStructures)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(salaryStructures.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteStructure(id: number) {
    const [deleted] = await db.delete(salaryStructures).where(eq(salaryStructures.id, id)).returning();
    return deleted ?? null;
  }

  // Components
  async findComponents(limit = 50, offset = 0) {
    return await db
      .select()
      .from(salaryComponents)
      .orderBy(desc(salaryComponents.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findComponentById(id: number) {
    const [item] = await db.select().from(salaryComponents).where(eq(salaryComponents.id, id));
    return item ?? null;
  }

  async createComponent(data: NewSalaryComponent) {
    const [created] = await db.insert(salaryComponents).values(data).returning();
    return created;
  }

  async updateComponent(id: number, data: Partial<NewSalaryComponent>) {
    const [updated] = await db
      .update(salaryComponents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(salaryComponents.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteComponent(id: number) {
    const [deleted] = await db.delete(salaryComponents).where(eq(salaryComponents.id, id)).returning();
    return deleted ?? null;
  }

  // Payslips
  async findPayslips(organizationId: number, limit = 50, offset = 0, search?: string) {
    const where = and(
      eq(payslips.organizationId, organizationId),
      search ? ilike(payslips.name, `%${search}%`) : undefined,
    );
    return await db
      .select()
      .from(payslips)
      .where(where)
      .orderBy(desc(payslips.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async countPayslips(organizationId: number, search?: string): Promise<number> {
    const where = and(
      eq(payslips.organizationId, organizationId),
      search ? ilike(payslips.name, `%${search}%`) : undefined,
    );
    const [res] = await db.select({ total: count() }).from(payslips).where(where);
    return res?.total ?? 0;
  }

  async findPayslipById(organizationId: number, id: number) {
    const [item] = await db.select().from(payslips).where(and(
      eq(payslips.id, id),
      eq(payslips.organizationId, organizationId),
    ));
    return item ?? null;
  }

  async createPayslip(data: NewPayslip) {
    const [created] = await db.insert(payslips).values(data).returning();
    return created;
  }

  async updatePayslip(organizationId: number, id: number, data: Partial<NewPayslip>) {
    const [updated] = await db
      .update(payslips)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(payslips.id, id),
        eq(payslips.organizationId, organizationId),
      ))
      .returning();
    return updated ?? null;
  }

  async deletePayslip(organizationId: number, id: number) {
    const [deleted] = await db.delete(payslips).where(and(
      eq(payslips.id, id),
      eq(payslips.organizationId, organizationId),
    )).returning();
    return deleted ?? null;
  }
}

export const payrollRepository = new PayrollRepository();
