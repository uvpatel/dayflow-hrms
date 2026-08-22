import { db } from "@/db";
import {
  organizations,
  departments,
  designations,
  locations,
  holidays,
  workSchedules,
} from "@/db/schema";
import { desc, eq, ilike, or } from "drizzle-orm";
import {
  NewOrganization,
  NewDepartment,
  NewDesignation,
  NewLocation,
  NewHoliday,
  NewWorkSchedule,
} from "./organization.types";

export class OrganizationRepository {
  // Organizations
  async findOrganizations(limit = 20, offset = 0, search?: string) {
    const where = search ? ilike(organizations.name, `%${search}%`) : undefined;
    const items = await db
      .select()
      .from(organizations)
      .where(where)
      .orderBy(desc(organizations.createdAt))
      .limit(limit)
      .offset(offset);
    return items;
  }

  async findOrganizationById(id: number) {
    const [item] = await db.select().from(organizations).where(eq(organizations.id, id));
    return item ?? null;
  }

  async createOrganization(data: NewOrganization) {
    const [created] = await db.insert(organizations).values(data).returning();
    return created;
  }

  async updateOrganization(id: number, data: Partial<NewOrganization>) {
    const [updated] = await db
      .update(organizations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return updated ?? null;
  }

  // Departments
  async findDepartments(limit = 50, offset = 0, search?: string) {
    const where = search
      ? or(ilike(departments.name, `%${search}%`), ilike(departments.description, `%${search}%`))
      : undefined;
    return await db
      .select()
      .from(departments)
      .where(where)
      .orderBy(desc(departments.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findDepartmentById(id: number) {
    const [item] = await db.select().from(departments).where(eq(departments.id, id));
    return item ?? null;
  }

  async createDepartment(data: NewDepartment) {
    const [created] = await db.insert(departments).values(data).returning();
    return created;
  }

  async updateDepartment(id: number, data: Partial<NewDepartment>) {
    const [updated] = await db
      .update(departments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(departments.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteDepartment(id: number) {
    const [deleted] = await db.delete(departments).where(eq(departments.id, id)).returning();
    return deleted ?? null;
  }

  // Designations
  async findDesignations(limit = 50, offset = 0, search?: string) {
    const where = search ? ilike(designations.name, `%${search}%`) : undefined;
    return await db
      .select()
      .from(designations)
      .where(where)
      .orderBy(desc(designations.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findDesignationById(id: number) {
    const [item] = await db.select().from(designations).where(eq(designations.id, id));
    return item ?? null;
  }

  async createDesignation(data: NewDesignation) {
    const [created] = await db.insert(designations).values(data).returning();
    return created;
  }

  async updateDesignation(id: number, data: Partial<NewDesignation>) {
    const [updated] = await db
      .update(designations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(designations.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteDesignation(id: number) {
    const [deleted] = await db.delete(designations).where(eq(designations.id, id)).returning();
    return deleted ?? null;
  }

  // Locations
  async findLocations(limit = 50, offset = 0, search?: string) {
    const where = search ? ilike(locations.name, `%${search}%`) : undefined;
    return await db
      .select()
      .from(locations)
      .where(where)
      .orderBy(desc(locations.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findLocationById(id: number) {
    const [item] = await db.select().from(locations).where(eq(locations.id, id));
    return item ?? null;
  }

  async createLocation(data: NewLocation) {
    const [created] = await db.insert(locations).values(data).returning();
    return created;
  }

  async updateLocation(id: number, data: Partial<NewLocation>) {
    const [updated] = await db
      .update(locations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(locations.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteLocation(id: number) {
    const [deleted] = await db.delete(locations).where(eq(locations.id, id)).returning();
    return deleted ?? null;
  }

  // Holidays
  async findHolidays(limit = 50, offset = 0, search?: string) {
    const where = search ? ilike(holidays.name, `%${search}%`) : undefined;
    return await db
      .select()
      .from(holidays)
      .where(where)
      .orderBy(desc(holidays.holidayDate))
      .limit(limit)
      .offset(offset);
  }

  async findHolidayById(id: number) {
    const [item] = await db.select().from(holidays).where(eq(holidays.id, id));
    return item ?? null;
  }

  async createHoliday(data: NewHoliday) {
    const [created] = await db.insert(holidays).values(data).returning();
    return created;
  }

  async updateHoliday(id: number, data: Partial<NewHoliday>) {
    const [updated] = await db
      .update(holidays)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(holidays.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteHoliday(id: number) {
    const [deleted] = await db.delete(holidays).where(eq(holidays.id, id)).returning();
    return deleted ?? null;
  }

  // Work Schedules
  async findWorkSchedules(limit = 50, offset = 0, employeeId?: number) {
    const where = employeeId ? eq(workSchedules.employeeId, employeeId) : undefined;
    return await db
      .select()
      .from(workSchedules)
      .where(where)
      .orderBy(desc(workSchedules.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findWorkScheduleById(id: number) {
    const [item] = await db.select().from(workSchedules).where(eq(workSchedules.id, id));
    return item ?? null;
  }

  async createWorkSchedule(data: NewWorkSchedule) {
    const [created] = await db.insert(workSchedules).values(data).returning();
    return created;
  }

  async updateWorkSchedule(id: number, data: Partial<NewWorkSchedule>) {
    const [updated] = await db
      .update(workSchedules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(workSchedules.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteWorkSchedule(id: number) {
    const [deleted] = await db.delete(workSchedules).where(eq(workSchedules.id, id)).returning();
    return deleted ?? null;
  }
}

export const organizationRepository = new OrganizationRepository();
