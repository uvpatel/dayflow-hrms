import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { employees, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Role, Permission, getRolePermissions, hasPermission } from "./permissions";
import type { Employee } from "@/db/schema/employees";

export interface BetterAuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BetterAuthSession {
  id: string;
  userId: string;
  expiresAt: Date;
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

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

  // 2. Check if an invitation/employee was pre-created by email
  const [empByEmail] = await db
    .select()
    .from(employees)
    .where(eq(employees.email, user.email))
    .limit(1);

  if (empByEmail) {
    // Link the userId
    const [linked] = await db
      .update(employees)
      .set({
        userId: user.id,
        updatedAt: new Date(),
      })
      .where(eq(employees.id, empByEmail.id))
      .returning();
    return linked;
  }

  // 3. If no employee record exists at all, auto-create one for the user
  const defaultOrgId = await ensureDefaultOrganization();
  const nameParts = (user.name || "Dayflow User").trim().split(/\s+/);
  const firstName = nameParts[0] || "User";
  const lastName = nameParts.slice(1).join(" ") || "Employee";

  // Public registration is never allowed to bootstrap a privileged account.
  // Development administrators are provisioned through the explicit seed flow;
  // production role changes require an authorized server-side operation.
  const userRole: Role = "employee";

  const [newEmp] = await db
    .insert(employees)
    .values({
      userId: user.id,
      organizationId: defaultOrgId,
      employeeNumber: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      firstName,
      lastName,
      email: user.email,
      role: userRole,
      employmentStatus: "active",
      employmentType: "full_time",
    })
    .returning();

  return newEmp;
}

/**
 * Resolves full authentication, identity, and authorization context for the current request.
 */
export async function getAuthContext(requestHeaders?: Headers): Promise<AuthContext | null> {
  try {
    const reqHeaders = requestHeaders ?? (await headers());
    const sessionRes = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!sessionRes || !sessionRes.user) {
      return null;
    }

    const authUser = sessionRes.user as BetterAuthUser;
    const authSession = sessionRes.session as BetterAuthSession;

    const employee = await resolveEmployee(authUser);

    // Determine normalized role
    let role: Role = "employee";
    if (employee?.role && ["admin", "hr", "manager", "employee"].includes(employee.role)) {
      role = employee.role as Role;
    } else if (authUser.role && ["admin", "hr", "manager", "employee"].includes(authUser.role)) {
      role = authUser.role as Role;
    }

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
  } catch (error) {
    console.error("Error resolving auth context:", error);
    return null;
  }
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
          error: "Authentication required. Please sign in.",
          code: "AUTH_REQUIRED",
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
          error: "Your employee account has been deactivated. Please contact HR.",
          code: "ACCOUNT_DISABLED",
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
export async function requirePermission(permission: Permission, requestHeaders?: Headers) {
  const { error, ctx } = await requireAuth(requestHeaders);
  if (error || !ctx) {
    return { error, ctx: null };
  }

  if (!hasPermission(ctx.role, permission)) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: `Access denied. Requires '${permission}' permission.`,
          code: "INSUFFICIENT_PERMISSION",
        },
        { status: 403 }
      ),
      ctx: null,
    };
  }

  return { error: null, ctx };
}
