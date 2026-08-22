import { db } from "@/db";
import {
  organizations,
  departments,
  designations,
  locations,
  holidays,
  workSchedules,
  employees,
} from "@/db/schema";
import { and, desc, eq, getTableColumns, ilike, inArray, or } from "drizzle-orm";
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

  async findOrganizationById(actorOrganizationId: number, id: number) {
    const [item] = await db
      .select()
      .from(organizations)
      .where(and(
        eq(organizations.id, id),
        eq(organizations.id, actorOrganizationId),
      ));
    return item ?? null;
  }

  async createOrganization(data: NewOrganization) {
    const [created] = await db.insert(organizations).values(data).returning();
    return created;
  }

  async updateOrganization(
    actorOrganizationId: number,
    id: number,
    data: Partial<NewOrganization>,
  ) {
    const [updated] = await db
      .update(organizations)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(organizations.id, id),
        eq(organizations.id, actorOrganizationId),
      ))
      .returning();
    return updated ?? null;
  }

  // Departments
  async findDepartments(organizationId: number, limit = 50, offset = 0, search?: string) {
    const searchCondition = search
      ? or(ilike(departments.name, `%${search}%`), ilike(departments.description, `%${search}%`))
      : undefined;
    return await db
      .select()
      .from(departments)
      .where(
        searchCondition
          ? and(eq(departments.organizationId, organizationId), searchCondition)
          : eq(departments.organizationId, organizationId),
      )
      .orderBy(desc(departments.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findDepartmentById(organizationId: number, id: number) {
    const [item] = await db
      .select()
      .from(departments)
      .where(and(eq(departments.id, id), eq(departments.organizationId, organizationId)));
    return item ?? null;
  }

  async createDepartment(
    organizationId: number,
    data: Omit<NewDepartment, "organizationId">,
  ) {
    const [created] = await db
      .insert(departments)
      .values({ ...data, organizationId })
      .returning();
    return created;
  }

  async updateDepartment(
    organizationId: number,
    id: number,
    data: Partial<Omit<NewDepartment, "organizationId">>,
  ) {
    const [updated] = await db
      .update(departments)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(departments.id, id), eq(departments.organizationId, organizationId)))
      .returning();
    return updated ?? null;
  }

  async deleteDepartment(organizationId: number, id: number) {
    const [deleted] = await db
      .delete(departments)
      .where(and(eq(departments.id, id), eq(departments.organizationId, organizationId)))
      .returning();
    return deleted ?? null;
  }

  // Designations
  async findDesignations(organizationId: number, limit = 50, offset = 0, search?: string) {
    const searchCondition = search ? ilike(designations.name, `%${search}%`) : undefined;
    return await db
      .select()
      .from(designations)
      .where(
        searchCondition
          ? and(eq(designations.organizationId, organizationId), searchCondition)
          : eq(designations.organizationId, organizationId),
      )
      .orderBy(desc(designations.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findDesignationById(organizationId: number, id: number) {
    const [item] = await db
      .select()
      .from(designations)
      .where(and(eq(designations.id, id), eq(designations.organizationId, organizationId)));
    return item ?? null;
  }

  async createDesignation(
    organizationId: number,
    data: Omit<NewDesignation, "organizationId">,
  ) {
    const [created] = await db
      .insert(designations)
      .values({ ...data, organizationId })
      .returning();
    return created;
  }

  async updateDesignation(
    organizationId: number,
    id: number,
    data: Partial<Omit<NewDesignation, "organizationId">>,
  ) {
    const [updated] = await db
      .update(designations)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(designations.id, id), eq(designations.organizationId, organizationId)))
      .returning();
    return updated ?? null;
  }

  async deleteDesignation(organizationId: number, id: number) {
    const [deleted] = await db
      .delete(designations)
      .where(and(eq(designations.id, id), eq(designations.organizationId, organizationId)))
      .returning();
    return deleted ?? null;
  }

  // Locations
  async findLocations(organizationId: number, limit = 50, offset = 0, search?: string) {
    const searchCondition = search ? ilike(locations.name, `%${search}%`) : undefined;
    return await db
      .select()
      .from(locations)
      .where(
        searchCondition
          ? and(eq(locations.organizationId, organizationId), searchCondition)
          : eq(locations.organizationId, organizationId),
      )
      .orderBy(desc(locations.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findLocationById(organizationId: number, id: number) {
    const [item] = await db
      .select()
      .from(locations)
      .where(and(eq(locations.id, id), eq(locations.organizationId, organizationId)));
    return item ?? null;
  }

  async createLocation(organizationId: number, data: Omit<NewLocation, "organizationId">) {
    const [created] = await db
      .insert(locations)
      .values({ ...data, organizationId })
      .returning();
    return created;
  }

  async updateLocation(
    organizationId: number,
    id: number,
    data: Partial<Omit<NewLocation, "organizationId">>,
  ) {
    const [updated] = await db
      .update(locations)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(locations.id, id), eq(locations.organizationId, organizationId)))
      .returning();
    return updated ?? null;
  }

  async deleteLocation(organizationId: number, id: number) {
    const [deleted] = await db
      .delete(locations)
      .where(and(eq(locations.id, id), eq(locations.organizationId, organizationId)))
      .returning();
    return deleted ?? null;
  }

  // Holidays
  async findHolidays(organizationId: number, limit = 50, offset = 0, search?: string) {
    const searchCondition = search ? ilike(holidays.name, `%${search}%`) : undefined;
    return await db
      .select()
      .from(holidays)
      .where(
        searchCondition
          ? and(eq(holidays.organizationId, organizationId), searchCondition)
          : eq(holidays.organizationId, organizationId),
      )
      .orderBy(desc(holidays.holidayDate))
      .limit(limit)
      .offset(offset);
  }

  async findHolidayById(organizationId: number, id: number) {
    const [item] = await db
      .select()
      .from(holidays)
      .where(and(eq(holidays.id, id), eq(holidays.organizationId, organizationId)));
    return item ?? null;
  }

  async createHoliday(organizationId: number, data: Omit<NewHoliday, "organizationId">) {
    const [created] = await db
      .insert(holidays)
      .values({ ...data, organizationId })
      .returning();
    return created;
  }

  async updateHoliday(
    organizationId: number,
    id: number,
    data: Partial<Omit<NewHoliday, "organizationId">>,
  ) {
    const [updated] = await db
      .update(holidays)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(holidays.id, id), eq(holidays.organizationId, organizationId)))
      .returning();
    return updated ?? null;
  }

  async deleteHoliday(organizationId: number, id: number) {
    const [deleted] = await db
      .delete(holidays)
      .where(and(eq(holidays.id, id), eq(holidays.organizationId, organizationId)))
      .returning();
    return deleted ?? null;
  }

  // Work Schedules
  async findWorkSchedules(
    organizationId: number,
    limit = 50,
    offset = 0,
    employeeIds?: number[],
  ) {
    if (employeeIds?.length === 0) return [];

    const where = employeeIds
      ? and(
          eq(employees.organizationId, organizationId),
          inArray(workSchedules.employeeId, employeeIds),
        )
      : eq(employees.organizationId, organizationId);
    return await db
      .select(getTableColumns(workSchedules))
      .from(workSchedules)
      .innerJoin(employees, eq(workSchedules.employeeId, employees.id))
      .where(where)
      .orderBy(desc(workSchedules.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findWorkScheduleById(organizationId: number, id: number) {
    const [item] = await db
      .select(getTableColumns(workSchedules))
      .from(workSchedules)
      .innerJoin(employees, eq(workSchedules.employeeId, employees.id))
      .where(and(eq(workSchedules.id, id), eq(employees.organizationId, organizationId)));
    return item ?? null;
  }

  async createWorkSchedule(organizationId: number, data: NewWorkSchedule) {
    const [employee] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(
        and(
          eq(employees.id, data.employeeId),
          eq(employees.organizationId, organizationId),
        ),
      );
    if (!employee) return null;

    const [created] = await db.insert(workSchedules).values(data).returning();
    return created ?? null;
  }

  async updateWorkSchedule(
    organizationId: number,
    id: number,
    data: Partial<Omit<NewWorkSchedule, "employeeId">>,
  ) {
    const organizationEmployeeIds = db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.organizationId, organizationId));
    const [updated] = await db
      .update(workSchedules)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(workSchedules.id, id),
          inArray(workSchedules.employeeId, organizationEmployeeIds),
        ),
      )
      .returning();
    return updated ?? null;
  }

  async deleteWorkSchedule(organizationId: number, id: number) {
    const organizationEmployeeIds = db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.organizationId, organizationId));
    const [deleted] = await db
      .delete(workSchedules)
      .where(
        and(
          eq(workSchedules.id, id),
          inArray(workSchedules.employeeId, organizationEmployeeIds),
        ),
      )
      .returning();
    return deleted ?? null;
  }
}

export const organizationRepository = new OrganizationRepository();
