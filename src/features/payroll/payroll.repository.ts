import { db } from "@/db";
import {
  payrollPeriods,
  salaryStructures,
  salaryComponents,
  payslips,
} from "@/db/schema";
import { count, desc, eq, ilike } from "drizzle-orm";
import {
  NewPayrollPeriod,
  NewSalaryStructure,
  NewSalaryComponent,
  NewPayslip,
} from "./payroll.types";

export class PayrollRepository {
  // Periods
  async findPeriods(limit = 20, offset = 0) {
    return await db
      .select()
      .from(payrollPeriods)
      .orderBy(desc(payrollPeriods.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async countPeriods(): Promise<number> {
    const [res] = await db.select({ total: count() }).from(payrollPeriods);
    return res?.total ?? 0;
  }

  async findPeriodById(id: number) {
    const [item] = await db.select().from(payrollPeriods).where(eq(payrollPeriods.id, id));
    return item ?? null;
  }

  async createPeriod(data: NewPayrollPeriod) {
    const [created] = await db.insert(payrollPeriods).values(data).returning();
    return created;
  }

  async updatePeriod(id: number, data: Partial<NewPayrollPeriod>) {
    const [updated] = await db
      .update(payrollPeriods)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(payrollPeriods.id, id))
      .returning();
    return updated ?? null;
  }

  async deletePeriod(id: number) {
    const [deleted] = await db.delete(payrollPeriods).where(eq(payrollPeriods.id, id)).returning();
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
  async findPayslips(limit = 50, offset = 0, search?: string) {
    const where = search ? ilike(payslips.name, `%${search}%`) : undefined;
    return await db
      .select()
      .from(payslips)
      .where(where)
      .orderBy(desc(payslips.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async countPayslips(search?: string): Promise<number> {
    const where = search ? ilike(payslips.name, `%${search}%`) : undefined;
    const [res] = await db.select({ total: count() }).from(payslips).where(where);
    return res?.total ?? 0;
  }

  async findPayslipById(id: number) {
    const [item] = await db.select().from(payslips).where(eq(payslips.id, id));
    return item ?? null;
  }

  async createPayslip(data: NewPayslip) {
    const [created] = await db.insert(payslips).values(data).returning();
    return created;
  }

  async updatePayslip(id: number, data: Partial<NewPayslip>) {
    const [updated] = await db
      .update(payslips)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(payslips.id, id))
      .returning();
    return updated ?? null;
  }

  async deletePayslip(id: number) {
    const [deleted] = await db.delete(payslips).where(eq(payslips.id, id)).returning();
    return deleted ?? null;
  }
}

export const payrollRepository = new PayrollRepository();
