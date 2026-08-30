import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { employees, user as authUsers } from "@/db/schema";
import type { Employee } from "@/db/schema/employees";
import { normalizeAccessRole, type Role } from "@/lib/permissions";

async function updateLinkedRolePair(
  employee: Pick<Employee, "id" | "userId"> & { userId: string },
  role: Role,
): Promise<Employee> {
  const updatedAt = new Date();
  const [updatedAuthUsers, updatedEmployees] = await db.batch([
    db
      .update(authUsers)
      .set({ role: normalizeAccessRole(role), updatedAt })
      .where(eq(authUsers.id, employee.userId))
      .returning({ id: authUsers.id }),
    db
      .update(employees)
      .set({ role, updatedAt })
      .where(
        and(
          eq(employees.id, employee.id),
          eq(employees.userId, employee.userId),
        ),
      )
      .returning(),
  ] as const);

  const updatedEmployee = updatedEmployees[0];
  if (!updatedAuthUsers[0] || !updatedEmployee) {
    throw new Error("Unable to synchronize the employee and authentication roles");
  }

  return updatedEmployee;
}

/** Updates an employee role and, once claimed, the Better Auth role atomically. */
export async function updateEmployeeRole(
  employeeId: number,
  role: Role,
): Promise<Employee | null> {
  const [employee] = await db
    .select()
    .from(employees)
    .where(eq(employees.id, employeeId))
    .limit(1);

  if (!employee) return null;

  if (!employee.userId) {
    const [updated] = await db
      .update(employees)
      .set({ role, updatedAt: new Date() })
      .where(eq(employees.id, employee.id))
      .returning();
    return updated ?? null;
  }

  return updateLinkedRolePair(
    { id: employee.id, userId: employee.userId },
    role,
  );
}

/**
 * Organization-scoped role update used by global auth-user management screens.
 * An unlinked identity is never eligible for an application role.
 */
export async function updateLinkedUserRole(
  userId: string,
  organizationId: number,
  role: Role,
): Promise<Employee | null> {
  const [employee] = await db
    .select()
    .from(employees)
    .where(
      and(
        eq(employees.userId, userId),
        eq(employees.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!employee?.userId) return null;
  return updateLinkedRolePair(
    { id: employee.id, userId: employee.userId },
    role,
  );
}

/** Repairs the derived Better Auth role from the authoritative employee role. */
export async function synchronizeAuthUserRole(
  userId: string,
  role: Role,
): Promise<void> {
  const [updated] = await db
    .update(authUsers)
    .set({ role: normalizeAccessRole(role), updatedAt: new Date() })
    .where(eq(authUsers.id, userId))
    .returning({ id: authUsers.id });

  if (!updated) {
    throw new Error("Unable to synchronize the authentication role");
  }
}
