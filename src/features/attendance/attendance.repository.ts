import { db, sql as neonSql } from "@/db";
import {
  attendanceCorrections,
  attendances,
  employees,
  organizations,
  workSchedules,
} from "@/db/schema";
import {
  and,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  lte,
  or,
  type SQL,
} from "drizzle-orm";
import { NewAttendance, NewAttendanceCorrection } from "./attendance.types";

export interface AttendanceScope {
  organizationId?: number | null;
  employeeIds?: number[];
  status?: string;
  from?: Date;
  to?: Date;
}

export interface AtomicCorrectionDecision {
  correctionId: number;
  employeeId: number;
  organizationId: number;
  reviewerId: number;
  decision: "approved" | "rejected";
  comment: string | null;
  attendanceId: number | null;
  attendanceUserId: string;
  workDate: string;
  attendanceDate: Date;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  breakMinutes: number;
  workMinutes: number | null;
  overtimeMinutes: number;
  workHours: string | null;
  status: "present" | "absent" | "half_day";
  scheduledStartMinutes: number;
  scheduledEndMinutes: number;
  scheduleTimezone: string;
  isLate: boolean;
}

interface IdRow {
  id: number;
}

export class AttendanceRepository {
  private attendanceWhere(scope: AttendanceScope) {
    const conditions: SQL[] = [];
    if (scope.organizationId) conditions.push(eq(attendances.organizationId, scope.organizationId));
    if (scope.employeeIds) {
      if (scope.employeeIds.length === 0) return null;
      conditions.push(inArray(attendances.employeeId, scope.employeeIds));
    }
    if (scope.status) conditions.push(eq(attendances.status, scope.status));
    if (scope.from) conditions.push(gte(attendances.date, scope.from));
    if (scope.to) conditions.push(lte(attendances.date, scope.to));
    return conditions.length ? and(...conditions) : undefined;
  }

  async findAttendances(limit = 20, offset = 0, scope: AttendanceScope = {}) {
    if (scope.employeeIds?.length === 0) return [];
    return db.select().from(attendances)
      .where(this.attendanceWhere(scope) ?? undefined)
      .orderBy(desc(attendances.date)).limit(limit).offset(offset);
  }

  async countAttendances(scope: AttendanceScope = {}): Promise<number> {
    if (scope.employeeIds?.length === 0) return 0;
    const [result] = await db.select({ total: count() }).from(attendances)
      .where(this.attendanceWhere(scope) ?? undefined);
    return result?.total ?? 0;
  }

  async findAttendanceById(id: number) {
    const [record] = await db.select().from(attendances).where(eq(attendances.id, id));
    return record ?? null;
  }

  async findLatestAttendance(employeeId: number) {
    const [record] = await db.select().from(attendances)
      .where(eq(attendances.employeeId, employeeId))
      .orderBy(desc(attendances.date)).limit(1);
    return record ?? null;
  }

  async findAttendanceForWorkDate(employeeId: number, workDate: string) {
    const [record] = await db.select().from(attendances)
      .where(and(eq(attendances.employeeId, employeeId), eq(attendances.workDate, workDate)))
      .limit(1);
    return record ?? null;
  }

  async findOpenAttendance(employeeId: number) {
    const [record] = await db.select().from(attendances)
      .where(and(
        eq(attendances.employeeId, employeeId),
        isNotNull(attendances.checkInTime),
        isNull(attendances.checkOutTime),
      ))
      .orderBy(desc(attendances.checkInTime)).limit(1);
    return record ?? null;
  }

  async findSchedule(employeeId: number, scheduleId: number | null, now: Date) {
    if (scheduleId) {
      const [schedule] = await db.select().from(workSchedules)
        .where(and(eq(workSchedules.id, scheduleId), eq(workSchedules.employeeId, employeeId)))
        .limit(1);
      if (schedule) return schedule;
    }
    const [schedule] = await db.select().from(workSchedules)
      .where(and(
        eq(workSchedules.employeeId, employeeId),
        lte(workSchedules.startDate, now),
        or(isNull(workSchedules.endDate), gte(workSchedules.endDate, now)),
      ))
      .orderBy(desc(workSchedules.startDate)).limit(1);
    return schedule ?? null;
  }

  async findOrganizationTimezone(organizationId: number | null) {
    if (!organizationId) return "UTC";
    const [organization] = await db.select({ timezone: organizations.timezone })
      .from(organizations).where(eq(organizations.id, organizationId)).limit(1);
    return organization?.timezone ?? "UTC";
  }

  async findEmployeeIdentity(identity: string) {
    const numericId = Number(identity);
    const [employee] = await db.select().from(employees).where(
      Number.isInteger(numericId) && numericId > 0
        ? eq(employees.id, numericId)
        : or(eq(employees.userId, identity), eq(employees.email, identity)),
    ).limit(1);
    return employee ?? null;
  }

  async createAttendance(data: NewAttendance) {
    const [created] = await db.insert(attendances).values(data).returning();
    return created;
  }

  async closeOpenAttendance(
    attendanceId: number,
    employeeId: number,
    checkOutTime: Date,
    data: Partial<NewAttendance>,
  ) {
    const [updated] = await db.update(attendances)
      .set({ ...data, checkOutTime, updatedAt: checkOutTime })
      .where(and(
        eq(attendances.id, attendanceId),
        eq(attendances.employeeId, employeeId),
        isNotNull(attendances.checkInTime),
        isNull(attendances.checkOutTime),
        lte(attendances.checkInTime, checkOutTime),
      ))
      .returning();
    return updated ?? null;
  }

  async updateAttendance(id: number, data: Partial<NewAttendance>) {
    const [updated] = await db.update(attendances)
      .set({ ...data, updatedAt: new Date() }).where(eq(attendances.id, id)).returning();
    return updated ?? null;
  }

  async deleteAttendance(id: number) {
    const [deleted] = await db.delete(attendances).where(eq(attendances.id, id)).returning();
    return deleted ?? null;
  }

  private correctionWhere(organizationId: number, employeeIds?: number[]): SQL {
    const conditions: SQL[] = [
      eq(attendanceCorrections.organizationId, organizationId),
    ];
    if (employeeIds) {
      conditions.push(inArray(attendanceCorrections.employeeId, employeeIds));
    }
    return and(...conditions)!;
  }

  async findCorrections(
    organizationId: number,
    limit = 20,
    offset = 0,
    employeeIds?: number[],
  ) {
    if (employeeIds?.length === 0) return [];
    const where = this.correctionWhere(organizationId, employeeIds);
    return db.select().from(attendanceCorrections).where(where)
      .orderBy(desc(attendanceCorrections.createdAt)).limit(limit).offset(offset);
  }

  async countCorrections(
    organizationId: number,
    employeeIds?: number[],
  ): Promise<number> {
    if (employeeIds?.length === 0) return 0;
    const where = this.correctionWhere(organizationId, employeeIds);
    const [result] = await db.select({ total: count() }).from(attendanceCorrections).where(where);
    return result?.total ?? 0;
  }

  async findCorrectionById(id: number) {
    const [item] = await db.select().from(attendanceCorrections)
      .where(eq(attendanceCorrections.id, id));
    return item ?? null;
  }

  async createCorrection(data: NewAttendanceCorrection) {
    const [created] = await db.insert(attendanceCorrections).values(data).returning();
    return created;
  }

  async updateCorrection(id: number, data: Partial<NewAttendanceCorrection>) {
    const [updated] = await db.update(attendanceCorrections)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(attendanceCorrections.id, id)).returning();
    return updated ?? null;
  }

  async decideCorrectionAtomically(input: AtomicCorrectionDecision) {
    const rows = (await neonSql`
      with target as materialized (
        select correction.*
        from attendance_corrections as correction
        join employees as subject on subject.id = correction.employee_id
        where correction.id = ${input.correctionId}
          and correction.status = 'pending'
          and correction.employee_id = ${input.employeeId}
          and correction.organization_id = ${input.organizationId}
          and subject.organization_id = ${input.organizationId}
        for update of correction
      ), attendance_update as (
        update attendances as attendance
        set
          user_id = ${input.attendanceUserId},
          organization_id = ${input.organizationId},
          work_date = ${input.workDate}::date,
          date = ${input.attendanceDate.toISOString()}::timestamptz,
          check_in_time = ${input.checkInTime?.toISOString() ?? null}::timestamptz,
          check_out_time = ${input.checkOutTime?.toISOString() ?? null}::timestamptz,
          break_minutes = ${input.breakMinutes},
          work_minutes = ${input.workMinutes},
          overtime_minutes = ${input.overtimeMinutes},
          work_hours = ${input.workHours},
          status = ${input.status},
          scheduled_start_minutes = ${input.scheduledStartMinutes},
          scheduled_end_minutes = ${input.scheduledEndMinutes},
          schedule_timezone = ${input.scheduleTimezone},
          is_late = ${input.isLate},
          updated_at = now()
        from target
        where ${input.decision} = 'approved'
          and ${input.attendanceId}::integer is not null
          and attendance.id = ${input.attendanceId}
          and attendance.employee_id = target.employee_id
          and attendance.organization_id = target.organization_id
        returning attendance.id
      ), attendance_insert as (
        insert into attendances (
          user_id,
          employee_id,
          organization_id,
          work_date,
          date,
          check_in_time,
          check_out_time,
          break_minutes,
          work_minutes,
          overtime_minutes,
          work_hours,
          status,
          scheduled_start_minutes,
          scheduled_end_minutes,
          schedule_timezone,
          is_late,
          created_at,
          updated_at
        )
        select
          ${input.attendanceUserId},
          target.employee_id,
          target.organization_id,
          ${input.workDate}::date,
          ${input.attendanceDate.toISOString()}::timestamptz,
          ${input.checkInTime?.toISOString() ?? null}::timestamptz,
          ${input.checkOutTime?.toISOString() ?? null}::timestamptz,
          ${input.breakMinutes},
          ${input.workMinutes},
          ${input.overtimeMinutes},
          ${input.workHours},
          ${input.status},
          ${input.scheduledStartMinutes},
          ${input.scheduledEndMinutes},
          ${input.scheduleTimezone},
          ${input.isLate},
          now(),
          now()
        from target
        where ${input.decision} = 'approved'
          and ${input.attendanceId}::integer is null
        on conflict (employee_id, work_date)
          where employee_id is not null and work_date is not null
        do update set
          check_in_time = excluded.check_in_time,
          check_out_time = excluded.check_out_time,
          break_minutes = excluded.break_minutes,
          work_minutes = excluded.work_minutes,
          overtime_minutes = excluded.overtime_minutes,
          work_hours = excluded.work_hours,
          status = excluded.status,
          scheduled_start_minutes = excluded.scheduled_start_minutes,
          scheduled_end_minutes = excluded.scheduled_end_minutes,
          schedule_timezone = excluded.schedule_timezone,
          is_late = excluded.is_late,
          updated_at = now()
        where attendances.employee_id = excluded.employee_id
          and attendances.organization_id = excluded.organization_id
        returning id
      ), decision_write as (
        update attendance_corrections as correction
        set
          status = ${input.decision},
          reviewed_by = ${input.reviewerId},
          review_comment = ${input.comment},
          reviewed_at = now(),
          updated_at = now()
        from target
        where correction.id = target.id
          and (
            ${input.decision} = 'rejected'
            or exists (select 1 from attendance_update)
            or exists (select 1 from attendance_insert)
          )
        returning correction.id, correction.employee_id, correction.status
      ), notification_write as (
        insert into notifications (user_id, message, read, created_at, updated_at)
        select
          decision_write.employee_id,
          'Your attendance correction was ' || decision_write.status ||
            case
              when ${input.comment}::text is not null then '. Comment: ' || ${input.comment}
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
            when decision_write.status = 'approved' then 'ATTENDANCE_CORRECTION_APPROVED'
            else 'ATTENDANCE_CORRECTION_REJECTED'
          end,
          'Attendance correction #' || decision_write.id || ' was ' ||
            decision_write.status || ' by employee #' || ${input.reviewerId},
          now(),
          now()
        from decision_write
        returning id
      )
      select decision_write.id
      from decision_write
    `) as unknown as IdRow[];

    return rows[0]?.id ? this.findCorrectionById(rows[0].id) : null;
  }

  async deleteCorrection(id: number) {
    const [deleted] = await db.delete(attendanceCorrections)
      .where(eq(attendanceCorrections.id, id)).returning();
    return deleted ?? null;
  }
}

export const attendanceRepository = new AttendanceRepository();
