import { db } from "@/db";
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
    employeeId: number,
    checkOutTime: Date,
    data: Partial<NewAttendance>,
  ) {
    const [updated] = await db.update(attendances)
      .set({ ...data, checkOutTime, updatedAt: checkOutTime })
      .where(and(
        eq(attendances.employeeId, employeeId),
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

  private correctionWhere(organizationId: number, employeeIds?: number[]) {
    const conditions: SQL[] = [
      eq(attendanceCorrections.organizationId, organizationId),
    ];
    if (employeeIds) {
      if (employeeIds.length === 0) return null;
      conditions.push(inArray(attendanceCorrections.employeeId, employeeIds));
    }
    return and(...conditions);
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

  async deleteCorrection(id: number) {
    const [deleted] = await db.delete(attendanceCorrections)
      .where(eq(attendanceCorrections.id, id)).returning();
    return deleted ?? null;
  }
}

export const attendanceRepository = new AttendanceRepository();
