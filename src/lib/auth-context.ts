import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import {
  type Role,
  type Permission,
  getRolePermissions,
  hasPermission,
  normalizeRole,
} from "./permissions";
import type { Employee } from "@/db/schema/employees";
import {
  AuthAccessError,
  getAuthAccessIssue,
} from "@/lib/auth/access";
import { synchronizeAuthUserRole } from "@/lib/auth/roles";
import {
  classifyAuthFailure,
  logAuthDiagnostic,
} from "@/lib/auth/diagnostics";

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

export type ProtectedAuthContext = Omit<AuthContext, "employee"> & {
  employee: Employee;
};

export function assertProtectedAuthContext(
  context: AuthContext | null,
): asserts context is ProtectedAuthContext {
  const issue = getAuthAccessIssue(context);
  if (issue) throw new AuthAccessError(issue);
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
    const employeeRole = normalizeRole(empByUserId.role);
    if (user.role !== employeeRole) {
      await synchronizeAuthUserRole(user.id, employeeRole);
    }
    return empByUserId;
  }

  // 2. A verified credential account claims the exact pre-issued employee ID
  // and email pair. First-time linking always starts at employee privilege; an
  // administrator must explicitly approve any later role elevation.
  if (user.emailVerified) {
    const employeeNumber =
      "employeeNumber" in user && typeof user.employeeNumber === "string"
        ? user.employeeNumber.trim().toUpperCase()
        : null;
    const [eligibleEmployee] = await db
      .select()
      .from(employees)
      .where(and(
        eq(employees.email, user.email.toLowerCase()),
        isNull(employees.userId),
        employeeNumber
          ? eq(employees.employeeNumber, employeeNumber)
          : undefined,
      ))
      .limit(1);

    if (eligibleEmployee) {
      const assignedRole = normalizeRole(eligibleEmployee.role) || "employee";
      const [linked] = await db
        .update(employees)
        .set({
          userId: user.id,
          role: assignedRole,
          updatedAt: new Date(),
        })
        .where(and(
          eq(employees.id, eligibleEmployee.id),
          isNull(employees.userId),
        ))
        .returning();
      if (linked) {
        await synchronizeAuthUserRole(user.id, assignedRole);
        return linked;
      }
    }
  }

  // Unprovisioned identities never create organizations or employee records as
  // a side effect of reading a session. HR must issue an employee record first.
  return null;
}

/**
 * Resolves full authentication, identity, and authorization context for the current request.
 */
export async function getAuthContext(
  requestHeaders?: Headers,
): Promise<AuthContext | null> {
  const reqHeaders = requestHeaders ?? (await headers());
  const sessionRes = await (async () => {
    try {
      return await auth.api.getSession({
        headers: reqHeaders,
      });
    } catch (error) {
      const classified = classifyAuthFailure(error);
      logAuthDiagnostic(
        classified === "AUTH_API_ERROR" ? "AUTH_SESSION_ERROR" : classified,
        {
          stage: "get-session",
          error,
        },
      );
      throw error;
    }
  })();

  if (!sessionRes?.user) {
    return null;
  }

  const authUser = sessionRes.user;
  const authSession = sessionRes.session;

  let employee: Employee | null;
  try {
    employee = await resolveEmployee(authUser);
  } catch (error) {
    const classified = classifyAuthFailure(error);
    logAuthDiagnostic(
      classified === "AUTH_API_ERROR"
        ? "AUTH_EMPLOYEE_LINK_ERROR"
        : classified,
      {
        stage: "resolve-employee",
        error,
      },
    );
    throw error;
  }

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
 * Secure application boundary for pages and server actions. A Better Auth
 * session alone is insufficient: the identity must resolve to a non-disabled
 * employee record before it can enter the HRMS application.
 */
export async function getProtectedAuthContext(
  requestHeaders?: Headers,
): Promise<ProtectedAuthContext> {
  const context = await getAuthContext(requestHeaders);
  assertProtectedAuthContext(context);
  return context;
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
  const accessIssue = getAuthAccessIssue(ctx);
  if (accessIssue === "AUTH_REQUIRED") {
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

  if (accessIssue === "EMPLOYEE_PROFILE_REQUIRED") {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: {
            code: accessIssue,
            message: "A linked employee profile is required to access Dayflow.",
          },
        },
        { status: 403 }
      ),
      ctx: null,
    };
  }

  if (accessIssue === "ACCOUNT_DISABLED") {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: {
            code: accessIssue,
            message:
              "Your employee account has been deactivated. Please contact HR.",
          },
        },
        { status: 403 }
      ),
      ctx: null,
    };
  }

  assertProtectedAuthContext(ctx);
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
