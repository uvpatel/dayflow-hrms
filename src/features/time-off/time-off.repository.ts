import { db, sql as neonSql } from "@/db";
import {
  leaveTypes,
  leavePolicies,
  leaveAllocations,
  leaveRequests,
  employees,
  holidays,
  workSchedules,
} from "@/db/schema";
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  gte,
  inArray,
  isNull,
  lte,
  or,
  sql as drizzleSql,
  type SQL,
} from "drizzle-orm";
import {
  NewLeaveType,
  NewLeavePolicy,
  NewLeaveAllocation,
  NewLeaveRequest,
} from "./time-off.types";

export interface LeaveRequestScope {
  organizationId: number;
  employeeIds?: number[];
  status?: string;
}

export interface AtomicLeaveSubmission {
  leaveTypeId: number;
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
  leaveTypeId: number;
  decision: "approved" | "rejected";
  comment: string | null;
}

export interface AtomicLeaveUpdate {
  leaveTypeId: number;
  requestId: number;
  employeeId: number;
  organizationId: number;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  days: string;
  unit: "full_day" | "half_day";
  reason: string | null;
}

interface IdRow {
  id: number;
}

export class TimeOffRepository {
  // Leave Types
  async findLeaveTypes(organizationId: number, limit = 50, offset = 0) {
    return await db
      .select()
      .from(leaveTypes)
      .where(or(
        eq(leaveTypes.organizationId, organizationId),
        isNull(leaveTypes.organizationId),
      ))
      .orderBy(desc(leaveTypes.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findLeaveTypeById(organizationId: number, id: number) {
    const [item] = await db.select().from(leaveTypes).where(and(
      eq(leaveTypes.id, id),
      or(
        eq(leaveTypes.organizationId, organizationId),
        isNull(leaveTypes.organizationId),
      ),
    ));
    return item ?? null;
  }

  async findLeaveTypeByName(name: string, organizationId: number) {
    const conditions = [
      eq(leaveTypes.name, name),
      or(
        eq(leaveTypes.organizationId, organizationId),
        isNull(leaveTypes.organizationId),
      )!,
    ];
    const items = await db
      .select()
      .from(leaveTypes)
      .where(and(...conditions))
      .orderBy(
        drizzleSql`case when ${leaveTypes.organizationId} = ${organizationId} then 0 else 1 end`,
        asc(leaveTypes.id),
      )
      .limit(1);
    return items[0] ?? null;
  }

  async createLeaveType(data: NewLeaveType) {
    const [created] = await db.insert(leaveTypes).values(data).returning();
    return created;
  }

  async updateLeaveType(organizationId: number, id: number, data: Partial<NewLeaveType>) {
    const [updated] = await db
      .update(leaveTypes)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(leaveTypes.id, id),
        eq(leaveTypes.organizationId, organizationId),
      ))
      .returning();
    return updated ?? null;
  }

  async deleteLeaveType(organizationId: number, id: number) {
    const [deleted] = await db.delete(leaveTypes).where(and(
      eq(leaveTypes.id, id),
      eq(leaveTypes.organizationId, organizationId),
    )).returning();
    return deleted ?? null;
  }

  // Leave Policies
  async findLeavePolicies(organizationId: number, limit = 50, offset = 0) {
    return await db
      .select()
      .from(leavePolicies)
      .where(eq(leavePolicies.organizationId, organizationId))
      .orderBy(desc(leavePolicies.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findLeavePolicyById(organizationId: number, id: number) {
    const [item] = await db.select().from(leavePolicies).where(and(
      eq(leavePolicies.id, id),
      eq(leavePolicies.organizationId, organizationId),
    ));
    return item ?? null;
  }

  async createLeavePolicy(data: NewLeavePolicy) {
    const [created] = await db.insert(leavePolicies).values(data).returning();
    return created;
  }

  async updateLeavePolicy(organizationId: number, id: number, data: Partial<NewLeavePolicy>) {
    const [updated] = await db
      .update(leavePolicies)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(leavePolicies.id, id),
        eq(leavePolicies.organizationId, organizationId),
      ))
      .returning();
    return updated ?? null;
  }

  async deleteLeavePolicy(organizationId: number, id: number) {
    const [deleted] = await db.delete(leavePolicies).where(and(
      eq(leavePolicies.id, id),
      eq(leavePolicies.organizationId, organizationId),
    )).returning();
    return deleted ?? null;
  }

  // Allocations
  async findAllocations(
    organizationId: number,
    limit = 50,
    offset = 0,
    employeeIds?: number[],
  ) {
    if (employeeIds?.length === 0) return [];
    return await db
      .select({ ...getTableColumns(leaveAllocations) })
      .from(leaveAllocations)
      .innerJoin(employees, eq(employees.id, leaveAllocations.employeeId))
      .where(and(
        eq(employees.organizationId, organizationId),
        employeeIds ? inArray(leaveAllocations.employeeId, employeeIds) : undefined,
      ))
      .orderBy(desc(leaveAllocations.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findAllocationById(organizationId: number, id: number) {
    const [item] = await db
      .select({ ...getTableColumns(leaveAllocations) })
      .from(leaveAllocations)
      .innerJoin(employees, eq(employees.id, leaveAllocations.employeeId))
      .where(and(
        eq(leaveAllocations.id, id),
        eq(employees.organizationId, organizationId),
      ));
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

  async findEmployeeSchedule(employeeId: number, scheduleId: number | null) {
    if (!scheduleId) return null;
    const [schedule] = await db
      .select()
      .from(workSchedules)
      .where(and(
        eq(workSchedules.id, scheduleId),
        eq(workSchedules.employeeId, employeeId),
      ))
      .limit(1);
    return schedule ?? null;
  }

  async findHolidayDateKeys(
    organizationId: number,
    startDate: Date,
    endDate: Date,
  ) {
    const rows = await db
      .select({ holidayDate: holidays.holidayDate })
      .from(holidays)
      .where(and(
        eq(holidays.organizationId, organizationId),
        gte(holidays.holidayDate, startDate),
        lte(holidays.holidayDate, endDate),
      ));
    return rows.map((row) => row.holidayDate.toISOString().slice(0, 10));
  }

  async createAllocation(data: NewLeaveAllocation) {
    const [created] = await db.insert(leaveAllocations).values(data).returning();
    return created;
  }

  async updateAllocation(organizationId: number, id: number, data: Partial<NewLeaveAllocation>) {
    const [updated] = await db
      .update(leaveAllocations)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(leaveAllocations.id, id),
        inArray(
          leaveAllocations.employeeId,
          db.select({ id: employees.id }).from(employees).where(
            eq(employees.organizationId, organizationId),
          ),
        ),
      ))
      .returning();
    return updated ?? null;
  }

  async deleteAllocation(organizationId: number, id: number) {
    const [deleted] = await db.delete(leaveAllocations).where(and(
      eq(leaveAllocations.id, id),
      inArray(
        leaveAllocations.employeeId,
        db.select({ id: employees.id }).from(employees).where(
          eq(employees.organizationId, organizationId),
        ),
      ),
    )).returning();
    return deleted ?? null;
  }

  // Requests
  async findRequests(limit: number, offset: number, scope: LeaveRequestScope) {
    if (scope.employeeIds?.length === 0) return [];
    const conditions: SQL[] = [];
    conditions.push(eq(leaveRequests.organizationId, scope.organizationId));
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

  async countRequests(scope: LeaveRequestScope): Promise<number> {
    if (scope.employeeIds?.length === 0) return 0;
    const conditions: SQL[] = [];
    conditions.push(eq(leaveRequests.organizationId, scope.organizationId));
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
        with resolved_leave_type as materialized (
          select leave_type.id, leave_type.name, leave_type.requires_balance
          from leave_types as leave_type
          where leave_type.id = ${data.leaveTypeId}
            and leave_type.name = ${data.leaveType}
            and leave_type.active
            and (
              leave_type.organization_id = ${data.organizationId}
              or leave_type.organization_id is null
            )
        ), candidate as (
          select
            ${data.employeeId}::integer as employee_id,
            ${data.organizationId}::integer as organization_id,
            resolved_leave_type.name as leave_type,
            ${data.startDate.toISOString()}::timestamptz as start_date,
            ${data.endDate.toISOString()}::timestamptz as end_date,
            ${data.days}::numeric(7,2) as days,
            ${data.unit}::text as unit,
            ${data.reason}::text as reason,
            resolved_leave_type.requires_balance
          from resolved_leave_type
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
          insert into activity_logs (
            organization_id,
            action,
            description,
            created_at,
            updated_at
          )
          select
            inserted.organization_id,
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
          leave_type.requires_balance
        from leave_requests as request
        join employees as subject on subject.id = request.employee_id
        join leave_types as leave_type
          on leave_type.id = ${input.leaveTypeId}
          and leave_type.name = request.leave_type
          and leave_type.active
          and (
            leave_type.organization_id = request.organization_id
            or leave_type.organization_id is null
          )
        where request.id = ${input.requestId}
          and request.status = 'pending'
          and request.organization_id = ${input.organizationId}
          and subject.organization_id = ${input.organizationId}
          and subject.organization_id = request.organization_id
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
        insert into activity_logs (
          organization_id,
          action,
          description,
          created_at,
          updated_at
        )
        select
          decision_write.organization_id,
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
      ), attendance_write as (
        insert into attendances (
          user_id,
          employee_id,
          organization_id,
          work_date,
          date,
          status,
          created_at,
          updated_at
        )
        select
          coalesce(subject.user_id, 'employee:' || subject.id),
          decision_write.employee_id,
          decision_write.organization_id,
          work_day::date,
          work_day::date::timestamptz,
          case
            when decision_write.unit = 'half_day' then 'half_day'
            else 'leave'
          end,
          now(),
          now()
        from decision_write
        join employees as subject on subject.id = decision_write.employee_id
        left join work_schedules as schedule
          on schedule.id = subject.work_schedule_id
          and schedule.employee_id = subject.id
        cross join lateral generate_series(
          decision_write.start_date::date,
          decision_write.end_date::date,
          interval '1 day'
        ) as series(work_day)
        where decision_write.status = 'approved'
          and extract(isodow from work_day)::integer = any(
            string_to_array(coalesce(schedule.weekdays, '1,2,3,4,5'), ',')::integer[]
          )
          and not exists (
            select 1
            from holidays as holiday
            where holiday.organization_id = decision_write.organization_id
              and holiday.holiday_date::date = work_day::date
          )
        on conflict (employee_id, work_date)
          where employee_id is not null and work_date is not null
        do update set
          status = excluded.status,
          updated_at = now()
        where attendances.check_in_time is null
          and attendances.status <> 'holiday'
        returning id
      )
      select decision_write.id
      from decision_write
    `) as unknown as IdRow[];

    return rows[0]?.id ? this.findRequestById(rows[0].id) : null;
  }

  async cancelRequestAtomically(
    requestId: number,
    employeeId: number,
    organizationId: number,
  ) {
    const rows = (await neonSql`
      with cancelled as (
        update leave_requests
        set status = 'cancelled', updated_at = now()
        where id = ${requestId}
          and employee_id = ${employeeId}
          and organization_id = ${organizationId}
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
        insert into activity_logs (
          organization_id,
          action,
          description,
          created_at,
          updated_at
        )
        select
          cancelled.organization_id,
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

  /**
   * Serializes edits with submissions for the same employee. The write only
   * succeeds while the request is still pending and both overlap and balance
   * predicates remain true at the point of update.
   */
  async updateRequestAtomically(data: AtomicLeaveUpdate) {
    const transactionResults = await neonSql.transaction((transactionSql) => [
      transactionSql`select pg_advisory_xact_lock(${data.employeeId})`,
      transactionSql`
        with resolved_leave_type as materialized (
          select leave_type.id, leave_type.name, leave_type.requires_balance
          from leave_types as leave_type
          where leave_type.id = ${data.leaveTypeId}
            and leave_type.name = ${data.leaveType}
            and leave_type.active
            and (
              leave_type.organization_id = ${data.organizationId}
              or leave_type.organization_id is null
            )
        ), candidate as (
          select
            ${data.requestId}::integer as request_id,
            ${data.employeeId}::integer as employee_id,
            ${data.organizationId}::integer as organization_id,
            resolved_leave_type.name as leave_type,
            ${data.startDate.toISOString()}::timestamptz as start_date,
            ${data.endDate.toISOString()}::timestamptz as end_date,
            ${data.days}::numeric(7,2) as days,
            ${data.unit}::text as unit,
            ${data.reason}::text as reason,
            resolved_leave_type.requires_balance
          from resolved_leave_type
        ), eligible as materialized (
          select request.id
          from leave_requests as request
          cross join candidate
          where request.id = candidate.request_id
            and request.employee_id = candidate.employee_id
            and request.organization_id = candidate.organization_id
            and request.status = 'pending'
            and not exists (
              select 1
              from leave_requests as existing
              where existing.employee_id = candidate.employee_id
                and existing.id <> candidate.request_id
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
          for update of request
        ), updated as (
          update leave_requests as request
          set
            leave_type = candidate.leave_type,
            start_date = candidate.start_date,
            end_date = candidate.end_date,
            days = candidate.days,
            unit = candidate.unit,
            reason = candidate.reason,
            updated_at = now()
          from candidate, eligible
          where request.id = eligible.id
          returning request.*
        ), notification_write as (
          insert into notifications (user_id, message, read, created_at, updated_at)
          select
            updated.employee_id,
            'Your ' || updated.leave_type || ' leave request was updated.',
            0,
            now(),
            now()
          from updated
          returning id
        ), audit_write as (
          insert into activity_logs (
            organization_id,
            action,
            description,
            created_at,
            updated_at
          )
          select
            updated.organization_id,
            'LEAVE_REQUEST_UPDATED',
            'Employee #' || updated.employee_id || ' updated leave request #' || updated.id,
            now(),
            now()
          from updated
          returning id
        )
        select updated.id
        from updated
      `,
    ]);

    const rows = transactionResults[1] as unknown as IdRow[];
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
}

export const timeOffRepository = new TimeOffRepository();
