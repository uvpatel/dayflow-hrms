import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AuthenticationError, AuthorizationError } from "@/lib/api/errors";
import { Permission, hasPermission } from "./permissions";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string | null;
}

export interface EmployeeContext {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

export interface AuthContext {
  user: AuthUser;
  employee: EmployeeContext | null;
  organizationId: number;
}

export async function getAuthSession(request?: NextRequest) {
  try {
    const reqHeaders = request?.headers ?? (await headers());
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });
    return session;
  } catch (err) {
    return null;
  }
}

export async function requireAuth(request?: NextRequest): Promise<{ user: AuthUser; session: unknown }> {
  const sessionData = await getAuthSession(request);

  if (!sessionData?.user) {
    throw new AuthenticationError("Authentication required to access this resource");
  }

  const user = sessionData.user as AuthUser;
  return {
    user,
    session: sessionData.session,
  };
}

export async function getAuthContext(request?: NextRequest): Promise<AuthContext> {
  const { user } = await requireAuth(request);

  // Attempt to resolve corresponding employee record by email
  const [matchingEmployee] = await db
    .select()
    .from(employees)
    .where(eq(employees.email, user.email))
    .limit(1);

  return {
    user,
    employee: matchingEmployee
      ? {
          id: matchingEmployee.id,
          firstName: matchingEmployee.firstName,
          lastName: matchingEmployee.lastName,
          email: matchingEmployee.email,
          phoneNumber: matchingEmployee.phoneNumber,
        }
      : null,
    organizationId: 1, // Default root organization
  };
}

export function requirePermission(context: AuthContext, permission: Permission): void {
  if (!hasPermission(context.user.role, permission)) {
    throw new AuthorizationError(
      `Access denied: Missing required permission '${permission}' for role '${context.user.role || "user"}'`
    );
  }
}
