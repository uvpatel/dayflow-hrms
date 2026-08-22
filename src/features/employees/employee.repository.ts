import { db } from "@/db";
import {
  employees,
  employeeAddresses,
  emergencyContacts,
  employeeDocuments,
} from "@/db/schema";
import { and, count, desc, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import {
  NewEmployee,
  NewEmployeeAddress,
  NewEmergencyContact,
  NewEmployeeDocument,
  FullEmployeeProfile,
} from "./employee.types";

export class EmployeeRepository {
  async findEmployees(
    limit = 20,
    offset = 0,
    search?: string,
    scope?: {
      organizationId?: number | null;
      managerId?: number;
      employeeIds?: number[];
      departmentId?: number;
      status?: string;
    },
  ) {
    const conditions: SQL[] = [];
    if (search) {
      conditions.push(or(
          ilike(employees.firstName, `%${search}%`),
          ilike(employees.lastName, `%${search}%`),
          ilike(employees.email, `%${search}%`),
          ilike(employees.phoneNumber, `%${search}%`),
          ilike(employees.employeeNumber, `%${search}%`),
        )!);
    }
    if (scope?.organizationId) {
      conditions.push(eq(employees.organizationId, scope.organizationId));
    }
    if (scope?.managerId) {
      conditions.push(eq(employees.managerId, scope.managerId));
    }
    if (scope?.employeeIds) {
      if (scope.employeeIds.length === 0) return [];
      conditions.push(inArray(employees.id, scope.employeeIds));
    }
    if (scope?.departmentId) {
      conditions.push(eq(employees.departmentId, scope.departmentId));
    }
    if (scope?.status) {
      conditions.push(eq(employees.employmentStatus, scope.status));
    }

    const where = conditions.length ? and(...conditions) : undefined;

    return await db
      .select()
      .from(employees)
      .where(where)
      .orderBy(desc(employees.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async countEmployees(
    search?: string,
    scope?: {
      organizationId?: number | null;
      managerId?: number;
      employeeIds?: number[];
      departmentId?: number;
      status?: string;
    },
  ): Promise<number> {
    const conditions: SQL[] = [];
    if (search) {
      conditions.push(or(
          ilike(employees.firstName, `%${search}%`),
          ilike(employees.lastName, `%${search}%`),
          ilike(employees.email, `%${search}%`),
          ilike(employees.phoneNumber, `%${search}%`),
          ilike(employees.employeeNumber, `%${search}%`),
        )!);
    }
    if (scope?.organizationId) conditions.push(eq(employees.organizationId, scope.organizationId));
    if (scope?.managerId) conditions.push(eq(employees.managerId, scope.managerId));
    if (scope?.employeeIds) {
      if (scope.employeeIds.length === 0) return 0;
      conditions.push(inArray(employees.id, scope.employeeIds));
    }
    if (scope?.departmentId) conditions.push(eq(employees.departmentId, scope.departmentId));
    if (scope?.status) conditions.push(eq(employees.employmentStatus, scope.status));

    const where = conditions.length ? and(...conditions) : undefined;

    const [res] = await db.select({ total: count() }).from(employees).where(where);
    return res?.total ?? 0;
  }

  async findEmployeeById(id: number) {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee ?? null;
  }

  async findEmployeeByEmail(email: string) {
    const [employee] = await db.select().from(employees).where(eq(employees.email, email));
    return employee ?? null;
  }

  async findEmployeeByUserId(userId: string) {
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.userId, userId))
      .limit(1);
    return employee ?? null;
  }

  async findDirectReports(managerId: number, organizationId?: number | null) {
    const conditions = [eq(employees.managerId, managerId)];
    if (organizationId) conditions.push(eq(employees.organizationId, organizationId));
    return db
      .select()
      .from(employees)
      .where(and(...conditions))
      .orderBy(employees.firstName, employees.lastName);
  }

  async getManagerAncestorIds(employeeId: number): Promise<number[]> {
    const ancestors: number[] = [];
    const visited = new Set<number>();
    let current = await this.findEmployeeById(employeeId);

    while (current?.managerId && !visited.has(current.managerId)) {
      visited.add(current.managerId);
      ancestors.push(current.managerId);
      current = await this.findEmployeeById(current.managerId);
    }

    return ancestors;
  }

  async findEmployeeWithRelations(id: number): Promise<FullEmployeeProfile | null> {
    const employee = await this.findEmployeeById(id);
    if (!employee) return null;

    const [addresses, contacts, documents] = await Promise.all([
      db.select().from(employeeAddresses).where(eq(employeeAddresses.employeeId, id)),
      db.select().from(emergencyContacts).where(eq(emergencyContacts.employeeId, id)),
      db.select().from(employeeDocuments).where(eq(employeeDocuments.employeeId, id)),
    ]);

    return {
      ...employee,
      addresses,
      emergencyContacts: contacts,
      documents,
    };
  }

  async createEmployee(data: NewEmployee) {
    const [created] = await db.insert(employees).values(data).returning();
    return created;
  }

  async createAddress(data: NewEmployeeAddress) {
    const [created] = await db.insert(employeeAddresses).values(data).returning();
    return created;
  }

  async createEmergencyContact(data: NewEmergencyContact) {
    const [created] = await db.insert(emergencyContacts).values(data).returning();
    return created;
  }

  async createDocument(data: NewEmployeeDocument) {
    const [created] = await db.insert(employeeDocuments).values(data).returning();
    return created;
  }

  async updateEmployee(id: number, data: Partial<NewEmployee>) {
    const [updated] = await db
      .update(employees)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteEmployee(id: number) {
    // Delete cascade associated child records
    await Promise.all([
      db.delete(employeeAddresses).where(eq(employeeAddresses.employeeId, id)),
      db.delete(emergencyContacts).where(eq(emergencyContacts.employeeId, id)),
      db.delete(employeeDocuments).where(eq(employeeDocuments.employeeId, id)),
    ]);

    const [deleted] = await db.delete(employees).where(eq(employees.id, id)).returning();
    return deleted ?? null;
  }
}

export const employeeRepository = new EmployeeRepository();
