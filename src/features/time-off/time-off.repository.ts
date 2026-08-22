import { db, sql as neonSql } from "@/db";
import {
  leaveTypes,
  leavePolicies,
  leaveAllocations,
  leaveRequests,
  approvalRequests,
} from "@/db/schema";
import { and, count, desc, eq, lte, gte, inArray, isNull, or, type SQL } from "drizzle-orm";
import {
  NewLeaveType,
  NewLeavePolicy,
  NewLeaveAllocation,
  NewLeaveRequest,
} from "./time-off.types";

export interface LeaveRequestScope {
  organizationId?: number | null;
  employeeIds?: number[];
  status?: string;
}

export interface AtomicLeaveSubmission {
  employeeId: number;
  organizationId: number;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  days: string;
  unit: "full_day" | "half_day";
  reason: string | null;
}

export interface AtomicLeaveDecision {
  requestId: number;
  actorEmployeeId: number;
  actorRole: string;
  organizationId: number;
  decision: "approved" | "rejected";
  comment: string | null;
}

interface IdRow {
  id: number;
}

export class TimeOffRepository {
  // Leave Types
  async findLeaveTypes(limit = 50, offset = 0) {
    return await db
      .select()
      .from(leaveTypes)
      .orderBy(desc(leaveTypes.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findLeaveTypeById(id: number) {
    const [item] = await db.select().from(leaveTypes).where(eq(leaveTypes.id, id));
    return item ?? null;
  }

  async findLeaveTypeByName(name: string, organizationId: number | null) {
    const conditions = [eq(leaveTypes.name, name)];
    if (organizationId) {
      conditions.push(
        or(
          eq(leaveTypes.organizationId, organizationId),
          isNull(leaveTypes.organizationId),
        )!,
      );
    }
    const items = await db
      .select()
      .from(leaveTypes)
      .where(and(...conditions))
      .limit(1);
    return items[0] ?? null;
  }

  async createLeaveType(data: NewLeaveType) {
    const [created] = await db.insert(leaveTypes).values(data).returning();
    return created;
  }

  async updateLeaveType(id: number, data: Partial<NewLeaveType>) {
    const [updated] = await db
      .update(leaveTypes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(leaveTypes.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteLeaveType(id: number) {
    const [deleted] = await db.delete(leaveTypes).where(eq(leaveTypes.id, id)).returning();
    return deleted ?? null;
  }

  // Leave Policies
  async findLeavePolicies(limit = 50, offset = 0) {
    return await db
      .select()
      .from(leavePolicies)
      .orderBy(desc(leavePolicies.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findLeavePolicyById(id: number) {
    const [item] = await db.select().from(leavePolicies).where(eq(leavePolicies.id, id));
    return item ?? null;
  }

  async createLeavePolicy(data: NewLeavePolicy) {
    const [created] = await db.insert(leavePolicies).values(data).returning();
    return created;
  }

  async updateLeavePolicy(id: number, data: Partial<NewLeavePolicy>) {
    const [updated] = await db
      .update(leavePolicies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(leavePolicies.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteLeavePolicy(id: number) {
    const [deleted] = await db.delete(leavePolicies).where(eq(leavePolicies.id, id)).returning();
    return deleted ?? null;
  }

  // Allocations
  async findAllocations(limit = 50, offset = 0, employeeId?: number) {
    const where = employeeId ? eq(leaveAllocations.employeeId, employeeId) : undefined;
    return await db
      .select()
      .from(leaveAllocations)
      .where(where)
      .orderBy(desc(leaveAllocations.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findAllocationById(id: number) {
    const [item] = await db.select().from(leaveAllocations).where(eq(leaveAllocations.id, id));
    return item ?? null;
  }

  async findAllocationByEmployeeAndType(employeeId: number, leaveType: string) {
    const [item] = await db
      .select()
      .from(leaveAllocations)
      .where(and(eq(leaveAllocations.employeeId, employeeId), eq(leaveAllocations.leaveType, leaveType)))
      .limit(1);
    return item ?? null;
  }

  async createAllocation(data: NewLeaveAllocation) {
    const [created] = await db.insert(leaveAllocations).values(data).returning();
    return created;
  }

  async updateAllocation(id: number, data: Partial<NewLeaveAllocation>) {
    const [updated] = await db
      .update(leaveAllocations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(leaveAllocations.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteAllocation(id: number) {
    const [deleted] = await db.delete(leaveAllocations).where(eq(leaveAllocations.id, id)).returning();
    return deleted ?? null;
  }

  // Requests
  async findRequests(limit = 20, offset = 0, scope: LeaveRequestScope = {}) {
    if (scope.employeeIds?.length === 0) return [];
    const conditions: SQL[] = [];
    if (scope.organizationId) {
      conditions.push(eq(leaveRequests.organizationId, scope.organizationId));
    }
    if (scope.employeeIds) {
      conditions.push(inArray(leaveRequests.employeeId, scope.employeeIds));
    }
    if (scope.status) conditions.push(eq(leaveRequests.status, scope.status));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    return await db
      .select()
      .from(leaveRequests)
      .where(where)
      .orderBy(desc(leaveRequests.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async countRequests(scope: LeaveRequestScope = {}): Promise<number> {
    if (scope.employeeIds?.length === 0) return 0;
    const conditions: SQL[] = [];
    if (scope.organizationId) {
      conditions.push(eq(leaveRequests.organizationId, scope.organizationId));
    }
    if (scope.employeeIds) {
      conditions.push(inArray(leaveRequests.employeeId, scope.employeeIds));
    }
    if (scope.status) conditions.push(eq(leaveRequests.status, scope.status));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const [res] = await db.select({ total: count() }).from(leaveRequests).where(where);
    return res?.total ?? 0;
  }

  async findRequestById(id: number) {
    const [item] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
    return item ?? null;
  }

  async findOverlappingRequests(employeeId: number, startDate: Date, endDate: Date, excludeId?: number) {
    const conditions = [
      eq(leaveRequests.employeeId, employeeId),
      or(eq(leaveRequests.status, "pending"), eq(leaveRequests.status, "approved")),
      lte(leaveRequests.startDate, endDate),
      gte(leaveRequests.endDate, startDate),
    ];

    const results = await db.select().from(leaveRequests).where(and(...conditions));
    if (excludeId) {
      return results.filter((r) => r.id !== excludeId);
    }
    return results;
  }

  async createRequest(data: NewLeaveRequest) {
    const [created] = await db.insert(leaveRequests).values(data).returning();
    return created;
  }

  /**
   * Serializes submissions for one employee with an advisory transaction lock.
   * The insert runs as the next READ COMMITTED statement, so a waiter observes
   * the request committed by the lock holder before checking for overlap.
   */
  async createRequestAtomically(data: AtomicLeaveSubmission) {
    const transactionResults = await neonSql.transaction((transactionSql) => [
      transactionSql`select pg_advisory_xact_lock(${data.employeeId})`,
      transactionSql`
        with candidate as (
          select
            ${data.employeeId}::integer as employee_id,
            ${data.organizationId}::integer as organization_id,
            ${data.leaveType}::text as leave_type,
            ${data.startDate.toISOString()}::timestamptz as start_date,
            ${data.endDate.toISOString()}::timestamptz as end_date,
            ${data.days}::numeric(7,2) as days,
            ${data.unit}::text as unit,
            ${data.reason}::text as reason,
            coalesce(
              (
                select leave_type.requires_balance
                from leave_types as leave_type
                where leave_type.name = ${data.leaveType}
                  and (
                    leave_type.organization_id = ${data.organizationId}
                    or leave_type.organization_id is null
                  )
                order by leave_type.organization_id nulls last
                limit 1
              ),
              lower(${data.leaveType}) not like '%unpaid%'
            ) as requires_balance
        ), inserted as (
          insert into leave_requests (
            employee_id,
            organization_id,
            leave_type,
            start_date,
            end_date,
            days,
            unit,
            reason,
            status,
            created_at,
            updated_at
          )
          select
            candidate.employee_id,
            candidate.organization_id,
            candidate.leave_type,
            candidate.start_date,
            candidate.end_date,
            candidate.days,
            candidate.unit,
            candidate.reason,
            'pending',
            now(),
            now()
          from candidate
          where not exists (
            select 1
            from leave_requests as existing
            where existing.employee_id = candidate.employee_id
              and existing.status in ('pending', 'approved')
              and existing.start_date <= candidate.end_date
              and existing.end_date >= candidate.start_date
          )
            and (
              not candidate.requires_balance
              or exists (
                select 1
                from leave_allocations as allocation
                where allocation.employee_id = candidate.employee_id
                  and allocation.leave_type = candidate.leave_type
                  and allocation.allocated_days - allocation.used_days >= candidate.days
              )
            )
          returning *
        ), approval_write as (
          insert into approval_requests (
            requestor_id,
            approver_id,
            status,
            created_at,
            updated_at
          )
          select
            inserted.employee_id,
            coalesce(
              employee.manager_id,
              (
                select approver.id
                from employees as approver
                where approver.organization_id = inserted.organization_id
                  and approver.role in ('hr', 'admin')
                  and approver.employment_status = 'active'
                order by case when approver.role = 'hr' then 0 else 1 end, approver.id
                limit 1
              ),
              inserted.employee_id
            ),
            'pending',
            now(),
            now()
          from inserted
          join employees as employee on employee.id = inserted.employee_id
          returning id
        ), notification_write as (
          insert into notifications (user_id, message, read, created_at, updated_at)
          select
            inserted.employee_id,
            'Your ' || inserted.leave_type || ' leave request was submitted.',
            0,
            now(),
            now()
          from inserted
          returning id
        ), audit_write as (
          insert into activity_logs (action, description, created_at, updated_at)
          select
            'LEAVE_REQUESTED',
            'Employee #' || inserted.employee_id || ' submitted leave request #' || inserted.id,
            now(),
            now()
          from inserted
          returning id
        )
        select inserted.id
        from inserted
      `,
    ]);

    const rows = transactionResults[1] as unknown as IdRow[];
    return rows[0]?.id ? this.findRequestById(rows[0].id) : null;
  }

  /** Updates the request, allocation, notification, and audit row in one SQL statement. */
  async decideRequestAtomically(input: AtomicLeaveDecision) {
    const rows = (await neonSql`
      with target as materialized (
        select
          request.*,
          coalesce(
            (
              select leave_type.requires_balance
              from leave_types as leave_type
              where leave_type.name = request.leave_type
                and (
                  leave_type.organization_id = request.organization_id
                  or leave_type.organization_id is null
                )
              order by leave_type.organization_id nulls last
              limit 1
            ),
            lower(request.leave_type) not like '%unpaid%'
          ) as requires_balance
        from leave_requests as request
        join employees as subject on subject.id = request.employee_id
        where request.id = ${input.requestId}
          and request.status = 'pending'
          and subject.organization_id = ${input.organizationId}
          and (
            ${input.actorRole} in ('admin', 'hr')
            or (
              ${input.actorRole} = 'manager'
              and subject.manager_id = ${input.actorEmployeeId}
            )
          )
        for update of request
      ), balance_write as (
        update leave_allocations as allocation
        set
          used_days = allocation.used_days + target.days,
          updated_at = now()
        from target
        where ${input.decision} = 'approved'
          and target.requires_balance
          and allocation.employee_id = target.employee_id
          and allocation.leave_type = target.leave_type
          and allocation.used_days + target.days <= allocation.allocated_days
        returning allocation.id
      ), decision_write as (
        update leave_requests as request
        set
          status = ${input.decision},
          approved_by = ${input.actorEmployeeId},
          decision_comment = ${input.comment},
          rejection_reason = case
            when ${input.decision} = 'rejected' then ${input.comment}
            else null
          end,
          decided_at = now(),
          updated_at = now()
        from target
        where request.id = target.id
          and (
            ${input.decision} = 'rejected'
            or (
              ${input.decision} = 'approved'
              and (
                not target.requires_balance
                or exists (select 1 from balance_write)
              )
            )
          )
        returning request.*
      ), notification_write as (
        insert into notifications (user_id, message, read, created_at, updated_at)
        select
          decision_write.employee_id,
          'Your ' || decision_write.leave_type || ' leave request was ' || decision_write.status ||
            case
              when decision_write.decision_comment is not null
                then '. Comment: ' || decision_write.decision_comment
              else '.'
            end,
          0,
          now(),
          now()
        from decision_write
        returning id
      ), audit_write as (
        insert into activity_logs (action, description, created_at, updated_at)
        select
          case
            when decision_write.status = 'approved' then 'LEAVE_APPROVED'
            else 'LEAVE_REJECTED'
          end,
          'Leave request #' || decision_write.id || ' was ' || decision_write.status ||
            ' by employee #' || ${input.actorEmployeeId},
          now(),
          now()
        from decision_write
        returning id
      )
      select decision_write.id
      from decision_write
    `) as unknown as IdRow[];

    return rows[0]?.id ? this.findRequestById(rows[0].id) : null;
  }

  async cancelRequestAtomically(requestId: number, employeeId: number) {
    const rows = (await neonSql`
      with cancelled as (
        update leave_requests
        set status = 'cancelled', updated_at = now()
        where id = ${requestId}
          and employee_id = ${employeeId}
          and status = 'pending'
        returning *
      ), notification_write as (
        insert into notifications (user_id, message, read, created_at, updated_at)
        select
          cancelled.employee_id,
          'Your ' || cancelled.leave_type || ' leave request was cancelled.',
          0,
          now(),
          now()
        from cancelled
        returning id
      ), audit_write as (
        insert into activity_logs (action, description, created_at, updated_at)
        select
          'LEAVE_CANCELLED',
          'Employee #' || cancelled.employee_id || ' cancelled leave request #' || cancelled.id,
          now(),
          now()
        from cancelled
        returning id
      )
      select cancelled.id
      from cancelled
    `) as unknown as IdRow[];

    return rows[0]?.id ? this.findRequestById(rows[0].id) : null;
  }

  async updateRequest(id: number, data: Partial<NewLeaveRequest>) {
    const [updated] = await db
      .update(leaveRequests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(leaveRequests.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteRequest(id: number) {
    const [deleted] = await db.delete(leaveRequests).where(eq(leaveRequests.id, id)).returning();
    return deleted ?? null;
  }

  async createApprovalRequest(requestorId: number, approverId: number, status = "pending") {
    const [created] = await db
      .insert(approvalRequests)
      .values({
        requestorId,
        approverId,
        status,
      })
      .returning();
    return created;
  }
}

export const timeOffRepository = new TimeOffRepository();
