import { db } from "@/db";
import {
  employees,
  employeeAddresses,
  emergencyContacts,
  employeeDocuments,
} from "@/db/schema";
import { count, desc, eq, ilike, or } from "drizzle-orm";
import {
  NewEmployee,
  NewEmployeeAddress,
  NewEmergencyContact,
  NewEmployeeDocument,
  FullEmployeeProfile,
} from "./employee.types";

export class EmployeeRepository {
  async findEmployees(limit = 20, offset = 0, search?: string) {
    const where = search
      ? or(
          ilike(employees.firstName, `%${search}%`),
          ilike(employees.lastName, `%${search}%`),
          ilike(employees.email, `%${search}%`),
          ilike(employees.phoneNumber, `%${search}%`)
        )
      : undefined;

    return await db
      .select()
      .from(employees)
      .where(where)
      .orderBy(desc(employees.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async countEmployees(search?: string): Promise<number> {
    const where = search
      ? or(
          ilike(employees.firstName, `%${search}%`),
          ilike(employees.lastName, `%${search}%`),
          ilike(employees.email, `%${search}%`),
          ilike(employees.phoneNumber, `%${search}%`)
        )
      : undefined;

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
