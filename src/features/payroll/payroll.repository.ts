import { db, sql as neonSql } from "@/db";
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
} from "./payroll.types";

interface IdRow {
  id: number;
}

export interface DraftPeriodUpdate {
  name?: string;
  description?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
}

export interface DraftPayslipCreate {
  organizationId: number;
  employeeId: number;
  payrollPeriodId: number;
  name: string | null;
  description: string | null;
  month: string | null;
  year: number | null;
  basicSalary: string | null;
  grossSalary: string;
  deductions: string;
  netSalary: string;
}

export interface DraftPayslipUpdate {
  name: string | null;
  description: string | null;
  month: string | null;
  year: number | null;
  basicSalary: string | null;
  grossSalary: string;
  deductions: string;
  netSalary: string;
}

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

  async updatePeriod(organizationId: number, id: number, data: DraftPeriodUpdate) {
    const rows = (await neonSql`
      update payroll_periods as period
      set
        name = case
          when ${data.name !== undefined} then ${data.name ?? null}::text
          else period.name
        end,
        description = case
          when ${data.description !== undefined} then ${data.description ?? null}::text
          else period.description
        end,
        start_date = case
          when ${data.startDate !== undefined}
            then ${data.startDate?.toISOString() ?? null}::timestamptz
          else period.start_date
        end,
        end_date = case
          when ${data.endDate !== undefined}
            then ${data.endDate?.toISOString() ?? null}::timestamptz
          else period.end_date
        end,
        updated_at = now()
      where period.id = ${id}
        and period.organization_id = ${organizationId}
        and period.status = 'draft'
      returning period.id
    `) as unknown as IdRow[];

    return rows[0]?.id ? this.findPeriodById(organizationId, rows[0].id) : null;
  }

  async deletePeriod(organizationId: number, id: number) {
    const rows = (await neonSql`
      delete from payroll_periods as period
      where period.id = ${id}
        and period.organization_id = ${organizationId}
        and period.status = 'draft'
      returning period.id
    `) as unknown as IdRow[];
    return rows[0] ?? null;
  }

  async calculatePeriod(organizationId: number, id: number) {
    const rows = (await neonSql`
      with target as materialized (
        select period.id
        from payroll_periods as period
        where period.id = ${id}
          and period.organization_id = ${organizationId}
          and period.status = 'draft'
        for update
      ), invalid_payslip as (
        select payslip.id
        from payslips as payslip
        join target on target.id = payslip.payroll_period_id
        where payslip.organization_id is distinct from ${organizationId}
          or payslip.status <> 'draft'
          or (
            payslip.gross_salary is null
            or coalesce(payslip.deductions, 0) > payslip.gross_salary
          )
        limit 1
      ), payslip_write as (
        update payslips as payslip
        set
          deductions = coalesce(payslip.deductions, 0),
          net_salary = payslip.gross_salary - coalesce(payslip.deductions, 0),
          status = 'calculated',
          published_at = null,
          updated_at = now()
        from target
        where payslip.payroll_period_id = target.id
          and payslip.organization_id = ${organizationId}
          and not exists (select 1 from invalid_payslip)
        returning payslip.id
      ), period_write as (
        update payroll_periods as period
        set status = 'review', updated_at = now()
        from target
        where period.id = target.id
          and not exists (select 1 from invalid_payslip)
          and exists (select 1 from payslip_write)
        returning period.id
      )
      select period_write.id from period_write
    `) as unknown as { id: number }[];

    return rows[0]?.id ? this.findPeriodById(organizationId, rows[0].id) : null;
  }

  async finalizePeriod(organizationId: number, id: number) {
    const rows = (await neonSql`
      with target as materialized (
        select period.id
        from payroll_periods as period
        where period.id = ${id}
          and period.organization_id = ${organizationId}
          and period.status = 'review'
        for update
      ), invalid_payslip as (
        select payslip.id
        from payslips as payslip
        join target on target.id = payslip.payroll_period_id
        where payslip.organization_id is distinct from ${organizationId}
          or (
            payslip.status not in ('calculated', 'reviewed')
            or payslip.gross_salary is null
            or payslip.net_salary is null
            or payslip.net_salary <> payslip.gross_salary - coalesce(payslip.deductions, 0)
          )
        limit 1
      ), payslip_write as (
        update payslips as payslip
        set status = 'reviewed', updated_at = now()
        from target
        where payslip.payroll_period_id = target.id
          and payslip.organization_id = ${organizationId}
          and not exists (select 1 from invalid_payslip)
        returning payslip.id
      ), period_write as (
        update payroll_periods as period
        set status = 'finalized', updated_at = now()
        from target
        where period.id = target.id
          and not exists (select 1 from invalid_payslip)
          and exists (select 1 from payslip_write)
        returning period.id
      )
      select period_write.id from period_write
    `) as unknown as { id: number }[];

    return rows[0]?.id ? this.findPeriodById(organizationId, rows[0].id) : null;
  }

  async publishPeriod(organizationId: number, id: number) {
    const rows = (await neonSql`
      with target as materialized (
        select period.id
        from payroll_periods as period
        where period.id = ${id}
          and period.organization_id = ${organizationId}
          and period.status = 'finalized'
        for update
      ), invalid_payslip as materialized (
        select payslip.id
        from payslips as payslip
        join target on target.id = payslip.payroll_period_id
        where payslip.organization_id is distinct from ${organizationId}
          or payslip.status <> 'reviewed'
        limit 1
      ), payslip_write as (
        update payslips as payslip
        set status = 'published', published_at = now(), updated_at = now()
        from target
        where payslip.payroll_period_id = target.id
          and payslip.organization_id = ${organizationId}
          and payslip.status = 'reviewed'
          and not exists (select 1 from invalid_payslip)
        returning payslip.id
      ), period_write as (
        update payroll_periods as period
        set status = 'published', updated_at = now()
        from target
        where period.id = target.id
          and exists (select 1 from payslip_write)
          and not exists (select 1 from invalid_payslip)
        returning period.id
      )
      select period_write.id from period_write
    `) as unknown as { id: number }[];

    return rows[0]?.id ? this.findPeriodById(organizationId, rows[0].id) : null;
  }

  // Structures
  async findStructures(organizationId: number, limit = 50, offset = 0) {
    return await db
      .select()
      .from(salaryStructures)
      .where(eq(salaryStructures.organizationId, organizationId))
      .orderBy(desc(salaryStructures.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findStructureById(organizationId: number, id: number) {
    const [item] = await db.select().from(salaryStructures).where(and(
      eq(salaryStructures.id, id),
      eq(salaryStructures.organizationId, organizationId),
    ));
    return item ?? null;
  }

  async createStructure(data: NewSalaryStructure) {
    const [created] = await db.insert(salaryStructures).values(data).returning();
    return created;
  }

  async updateStructure(organizationId: number, id: number, data: Partial<NewSalaryStructure>) {
    const [updated] = await db
      .update(salaryStructures)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(salaryStructures.id, id),
        eq(salaryStructures.organizationId, organizationId),
      ))
      .returning();
    return updated ?? null;
  }

  async deleteStructure(organizationId: number, id: number) {
    const [deleted] = await db.delete(salaryStructures).where(and(
      eq(salaryStructures.id, id),
      eq(salaryStructures.organizationId, organizationId),
    )).returning();
    return deleted ?? null;
  }

  // Components
  async findComponents(organizationId: number, limit = 50, offset = 0) {
    return await db
      .select()
      .from(salaryComponents)
      .where(eq(salaryComponents.organizationId, organizationId))
      .orderBy(desc(salaryComponents.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findComponentById(organizationId: number, id: number) {
    const [item] = await db.select().from(salaryComponents).where(and(
      eq(salaryComponents.id, id),
      eq(salaryComponents.organizationId, organizationId),
    ));
    return item ?? null;
  }

  async createComponent(data: NewSalaryComponent) {
    const [created] = await db.insert(salaryComponents).values(data).returning();
    return created;
  }

  async updateComponent(organizationId: number, id: number, data: Partial<NewSalaryComponent>) {
    const [updated] = await db
      .update(salaryComponents)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(salaryComponents.id, id),
        eq(salaryComponents.organizationId, organizationId),
      ))
      .returning();
    return updated ?? null;
  }

  async deleteComponent(organizationId: number, id: number) {
    const [deleted] = await db.delete(salaryComponents).where(and(
      eq(salaryComponents.id, id),
      eq(salaryComponents.organizationId, organizationId),
    )).returning();
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

  /** Locks the period before inserting so calculation cannot race a new slip. */
  async createPayslip(data: DraftPayslipCreate) {
    const rows = (await neonSql`
      with target_period as materialized (
        select period.id
        from payroll_periods as period
        where period.id = ${data.payrollPeriodId}
          and period.organization_id = ${data.organizationId}
          and period.status = 'draft'
        for update
      ), target_employee as materialized (
        select employee.id
        from employees as employee
        where employee.id = ${data.employeeId}
          and employee.organization_id = ${data.organizationId}
      ), inserted as (
        insert into payslips (
          organization_id,
          employee_id,
          payroll_period_id,
          name,
          description,
          month,
          year,
          basic_salary,
          gross_salary,
          deductions,
          net_salary,
          status,
          published_at,
          created_at,
          updated_at
        )
        select
          ${data.organizationId},
          target_employee.id,
          target_period.id,
          ${data.name},
          ${data.description},
          ${data.month},
          ${data.year},
          ${data.basicSalary}::numeric(14,2),
          ${data.grossSalary}::numeric(14,2),
          ${data.deductions}::numeric(14,2),
          ${data.netSalary}::numeric(14,2),
          'draft',
          null,
          now(),
          now()
        from target_period
        cross join target_employee
        returning id
      )
      select inserted.id from inserted
    `) as unknown as IdRow[];

    return rows[0]?.id
      ? this.findPayslipById(data.organizationId, rows[0].id)
      : null;
  }

  /** Locks period first, then payslip, matching lifecycle transition order. */
  async updatePayslip(
    organizationId: number,
    id: number,
    data: DraftPayslipUpdate,
  ) {
    const rows = (await neonSql`
      with candidate as materialized (
        select payslip.payroll_period_id
        from payslips as payslip
        where payslip.id = ${id}
          and payslip.organization_id = ${organizationId}
      ), target_period as materialized (
        select period.id
        from payroll_periods as period
        join candidate on candidate.payroll_period_id = period.id
        where period.organization_id = ${organizationId}
          and period.status = 'draft'
        for update of period
      ), target_payslip as materialized (
        select payslip.id
        from payslips as payslip
        join target_period on target_period.id = payslip.payroll_period_id
        where payslip.id = ${id}
          and payslip.organization_id = ${organizationId}
          and payslip.status = 'draft'
        for update of payslip
      ), updated as (
        update payslips as payslip
        set
          name = ${data.name},
          description = ${data.description},
          month = ${data.month},
          year = ${data.year},
          basic_salary = ${data.basicSalary}::numeric(14,2),
          gross_salary = ${data.grossSalary}::numeric(14,2),
          deductions = ${data.deductions}::numeric(14,2),
          net_salary = ${data.netSalary}::numeric(14,2),
          status = 'draft',
          published_at = null,
          updated_at = now()
        from target_payslip
        where payslip.id = target_payslip.id
        returning payslip.id
      )
      select updated.id from updated
    `) as unknown as IdRow[];

    return rows[0]?.id ? this.findPayslipById(organizationId, rows[0].id) : null;
  }

  async deletePayslip(organizationId: number, id: number) {
    const rows = (await neonSql`
      with candidate as materialized (
        select payslip.payroll_period_id
        from payslips as payslip
        where payslip.id = ${id}
          and payslip.organization_id = ${organizationId}
      ), target_period as materialized (
        select period.id
        from payroll_periods as period
        join candidate on candidate.payroll_period_id = period.id
        where period.organization_id = ${organizationId}
          and period.status = 'draft'
        for update of period
      ), target_payslip as materialized (
        select payslip.id
        from payslips as payslip
        join target_period on target_period.id = payslip.payroll_period_id
        where payslip.id = ${id}
          and payslip.organization_id = ${organizationId}
          and payslip.status = 'draft'
        for update of payslip
      ), deleted as (
        delete from payslips as payslip
        using target_payslip
        where payslip.id = target_payslip.id
        returning payslip.id
      )
      select deleted.id from deleted
    `) as unknown as IdRow[];
    return rows[0] ?? null;
  }
}

export const payrollRepository = new PayrollRepository();
