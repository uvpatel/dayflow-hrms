import { headers } from "next/headers";
import type { NextRequest } from "next/server";

import { auth } from "@/lib/auth";
import {
  getAuthContext as resolveAuthContext,
  type ProtectedAuthContext,
} from "@/lib/auth-context";
import { AuthenticationError, AuthorizationError } from "@/lib/api/errors";
import { getAuthAccessIssue } from "@/lib/auth/access";
import { type Permission, hasPermission } from "@/lib/permissions";

/**
 * Compatibility surface for API routes and services. Role resolution is
 * delegated to `auth-context`, which derives it from the linked employee
 * record rather than trusting a browser-provided or legacy auth-user role.
 */
export type AuthContext = ProtectedAuthContext;

export async function getAuthSession(request?: NextRequest) {
  try {
    return await auth.api.getSession({
      headers: request?.headers ?? (await headers()),
    });
  } catch {
    return null;
  }
}

export async function requireAuth(request?: NextRequest) {
  const context = await getAuthContext(request);
  return { user: context.user, session: context.session };
}

export async function getAuthContext(request?: NextRequest): Promise<AuthContext> {
  const context = await resolveAuthContext(request?.headers);
  const accessIssue = getAuthAccessIssue(context);

  if (accessIssue === "AUTH_REQUIRED") {
    throw new AuthenticationError("Authentication required to access this resource");
  }

  if (accessIssue === "EMPLOYEE_PROFILE_REQUIRED") {
    throw new AuthorizationError(
      "A linked employee profile is required to access Dayflow",
    );
  }

  if (accessIssue === "ACCOUNT_DISABLED") {
    throw new AuthorizationError("Your employee account has been deactivated. Please contact HR.");
  }

  return context as AuthContext;
}

export function requirePermission(context: AuthContext, permission: Permission): void {
  if (!hasPermission(context.role, permission)) {
    throw new AuthorizationError(
      `Access denied: missing '${permission}' permission for role '${context.role}'.`
    );
  }
}

export function requireOrganization(context: AuthContext): number {
  if (context.organizationId == null) {
    throw new AuthorizationError(
      "Your employee profile is not assigned to an organization.",
    );
  }
  return context.organizationId;
}
