import { db } from "@/db";
import { attendances, attendanceCorrections } from "@/db/schema";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { NewAttendance, NewAttendanceCorrection } from "./attendance.types";

export class AttendanceRepository {
  async findAttendances(limit = 20, offset = 0, userId?: string, status?: string) {
    const conditions = [];
    if (userId) conditions.push(eq(attendances.userId, userId));
    if (status) conditions.push(eq(attendances.status, status));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    return await db
      .select()
      .from(attendances)
      .where(where)
      .orderBy(desc(attendances.date))
      .limit(limit)
      .offset(offset);
  }

  async countAttendances(userId?: string, status?: string): Promise<number> {
    const conditions = [];
    if (userId) conditions.push(eq(attendances.userId, userId));
    if (status) conditions.push(eq(attendances.status, status));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const [res] = await db.select({ total: count() }).from(attendances).where(where);
    return res?.total ?? 0;
  }

  async findAttendanceById(id: number) {
    const [record] = await db.select().from(attendances).where(eq(attendances.id, id));
    return record ?? null;
  }

  async findLatestAttendance(userId: string) {
    const [record] = await db
      .select()
      .from(attendances)
      .where(eq(attendances.userId, userId))
      .orderBy(desc(attendances.date))
      .limit(1);
    return record ?? null;
  }

  async findOpenAttendance(userId: string) {
    const [record] = await db
      .select()
      .from(attendances)
      .where(and(eq(attendances.userId, userId), isNull(attendances.checkOutTime)))
      .orderBy(desc(attendances.date))
      .limit(1);
    return record ?? null;
  }

  async createAttendance(data: NewAttendance) {
    const [created] = await db.insert(attendances).values(data).returning();
    return created;
  }

  async updateAttendance(id: number, data: Partial<NewAttendance>) {
    const [updated] = await db
      .update(attendances)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(attendances.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteAttendance(id: number) {
    const [deleted] = await db.delete(attendances).where(eq(attendances.id, id)).returning();
    return deleted ?? null;
  }

  // Corrections
  async findCorrections(limit = 20, offset = 0, userId?: string) {
    const where = userId ? eq(attendanceCorrections.userId, userId) : undefined;
    return await db
      .select()
      .from(attendanceCorrections)
      .where(where)
      .orderBy(desc(attendanceCorrections.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async countCorrections(userId?: string): Promise<number> {
    const where = userId ? eq(attendanceCorrections.userId, userId) : undefined;
    const [res] = await db.select({ total: count() }).from(attendanceCorrections).where(where);
    return res?.total ?? 0;
  }

  async findCorrectionById(id: number) {
    const [item] = await db.select().from(attendanceCorrections).where(eq(attendanceCorrections.id, id));
    return item ?? null;
  }

  async createCorrection(data: NewAttendanceCorrection) {
    const [created] = await db.insert(attendanceCorrections).values(data).returning();
    return created;
  }

  async updateCorrection(id: number, data: Partial<NewAttendanceCorrection>) {
    const [updated] = await db
      .update(attendanceCorrections)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(attendanceCorrections.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteCorrection(id: number) {
    const [deleted] = await db.delete(attendanceCorrections).where(eq(attendanceCorrections.id, id)).returning();
    return deleted ?? null;
  }
}

export const attendanceRepository = new AttendanceRepository();
