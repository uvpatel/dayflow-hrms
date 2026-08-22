import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { employees, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  type Role,
  type Permission,
  getRolePermissions,
  hasPermission,
  normalizeRole,
} from "./permissions";
import type { Employee } from "@/db/schema/employees";

type InferredSession = typeof auth.$Infer.Session;
export type BetterAuthUser = InferredSession["user"];
export type BetterAuthSession = InferredSession["session"];

export interface AuthContext {
  session: BetterAuthSession;
  user: BetterAuthUser;
  employee: Employee | null;
  organizationId: number | null;
  role: Role;
  permissions: Permission[];
}

/**
 * Ensures at least one organization exists in the database.
 */
async function ensureDefaultOrganization(): Promise<number> {
  const [existingOrg] = await db.select().from(organizations).limit(1);
  if (existingOrg) {
    return existingOrg.id;
  }

  const [newOrg] = await db
    .insert(organizations)
    .values({
      name: "Dayflow Inc.",
      slug: "dayflow",
      description: "Default Dayflow Organization",
    })
    .returning();

  return newOrg.id;
}

/**
 * Resolves or links the Employee record corresponding to the authenticated User.
 */
async function resolveEmployee(user: BetterAuthUser): Promise<Employee | null> {
  // 1. Check if linked by userId
  const [empByUserId] = await db
    .select()
    .from(employees)
    .where(eq(employees.userId, user.id))
    .limit(1);

  if (empByUserId) {
    return empByUserId;
  }

  // 2. A verified account may claim an unlinked employee record with the
  // same email. First-time linking always starts at employee privilege; an
  // administrator must explicitly approve any later role elevation.
  if (user.emailVerified) {
    const [empByEmail] = await db
      .select()
      .from(employees)
      .where(eq(employees.email, user.email.toLowerCase()))
      .limit(1);

    if (empByEmail && !empByEmail.userId) {
      const [linked] = await db
        .update(employees)
        .set({
          userId: user.id,
          role: "employee",
          updatedAt: new Date(),
        })
        .where(eq(employees.id, empByEmail.id))
        .returning();
      return linked;
    }
  }

  // 3. If no employee record exists at all, auto-create one for the user
  const defaultOrgId = await ensureDefaultOrganization();
  const nameParts = (user.name || "Dayflow User").trim().split(/\s+/);
  const firstName = nameParts[0] || "User";
  const lastName = nameParts.slice(1).join(" ") || "Employee";

  // Public registration is never allowed to bootstrap a privileged account.
  // Development administrators are provisioned through the explicit seed flow;
  // production role changes require an authorized server-side operation.
  const [newEmployee] = await db
    .insert(employees)
    .values({
      userId: user.id,
      organizationId: defaultOrgId,
      employeeNumber: `EMP-${user.id.replace(/[^a-z0-9]/gi, "").slice(0, 12).toUpperCase()}`,
      firstName,
      lastName,
      email: user.email.toLowerCase(),
      role: "employee",
      employmentStatus: "active",
      employmentType: "full_time",
    })
    .onConflictDoNothing({ target: employees.userId })
    .returning();

  if (newEmployee) return newEmployee;

  const [concurrentlyCreatedEmployee] = await db
    .select()
    .from(employees)
    .where(eq(employees.userId, user.id))
    .limit(1);

  return concurrentlyCreatedEmployee ?? null;
}

/**
 * Resolves full authentication, identity, and authorization context for the current request.
 */
export async function getAuthContext(
  requestHeaders?: Headers,
): Promise<AuthContext | null> {
  const reqHeaders = requestHeaders ?? (await headers());
  const sessionRes = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!sessionRes?.user) {
    return null;
  }

  const authUser = sessionRes.user;
  const authSession = sessionRes.session;

  const employee = await resolveEmployee(authUser);

  // The linked employee record is the authorization source of truth. Better
  // Auth's user role is deliberately not used as a fallback because the two
  // records can be temporarily out of sync during onboarding or demotion.
  const role = normalizeRole(employee?.role);

  const organizationId = employee?.organizationId ?? null;
  const permissions = getRolePermissions(role);

  return {
    session: authSession,
    user: authUser,
    employee,
    organizationId,
    role,
    permissions,
  };
}

/**
 * Helper to get current session.
 */
export async function getCurrentSession(): Promise<BetterAuthSession | null> {
  const ctx = await getAuthContext();
  return ctx?.session ?? null;
}

/**
 * Helper to get current user.
 */
export async function getCurrentUser(): Promise<BetterAuthUser | null> {
  const ctx = await getAuthContext();
  return ctx?.user ?? null;
}

/**
 * Helper to get current employee.
 */
export async function getCurrentEmployee(): Promise<Employee | null> {
  const ctx = await getAuthContext();
  return ctx?.employee ?? null;
}

/**
 * Guard for API routes requiring authentication.
 * Returns { ctx } or a 401 Response.
 */
export async function requireAuth(requestHeaders?: Headers) {
  const ctx = await getAuthContext(requestHeaders);
  if (!ctx) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: {
            code: "AUTH_REQUIRED",
            message: "Authentication required. Please sign in.",
          },
        },
        { status: 401 }
      ),
      ctx: null,
    };
  }

  // Account status check
  if (ctx.employee && ctx.employee.employmentStatus === "inactive") {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: {
            code: "ACCOUNT_DISABLED",
            message:
              "Your employee account has been deactivated. Please contact HR.",
          },
        },
        { status: 403 }
      ),
      ctx: null,
    };
  }

  return { error: null, ctx };
}

/**
 * Guard for API routes requiring specific permission.
 */
export async function requirePermission(
  permission: Permission,
  requestHeaders?: Headers,
) {
  const { error, ctx } = await requireAuth(requestHeaders);
  if (error || !ctx) {
    return { error, ctx: null };
  }

  if (!hasPermission(ctx.role, permission)) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: {
            code: "INSUFFICIENT_PERMISSION",
            message: `Access denied. Requires '${permission}' permission.`,
          },
        },
        { status: 403 }
      ),
      ctx: null,
    };
  }

  return { error: null, ctx };
}
