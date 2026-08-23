import { describe, expect, test } from "bun:test";
import { getTableColumns } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";

import {
  canAccessEmployeeResource,
  canAccessPage,
  getRolePermissions,
  hasPermission,
  normalizeRole,
} from "../src/lib/permissions";
import {
  account,
  session,
  user,
  verification,
} from "../src/db/schema/auth-schema";
import { getRoleLandingPath } from "../src/lib/auth/landing";
import { sanitizeCallbackPath } from "../src/lib/auth/redirects";

describe("role permissions", () => {
  test("does not allow an employee to access another employee's payroll", () => {
    expect(hasPermission("employee", "payroll:read:any")).toBe(false);
    expect(hasPermission("employee", "payroll:read:self")).toBe(true);
  });

  test("allows HR to manage payroll but not delete employees", () => {
    expect(hasPermission("hr", "payroll:manage")).toBe(true);
    expect(hasPermission("hr", "employee:delete")).toBe(false);
  });

  test("limits approval actions to designated reviewers and audit access to HR", () => {
    expect(hasPermission("employee", "approval:action")).toBe(false);
    expect(hasPermission("manager", "approval:action")).toBe(true);
    expect(hasPermission("hr", "approval:action")).toBe(true);
    expect(hasPermission("hr", "audit:read")).toBe(true);
    expect(hasPermission("admin", "audit:read")).toBe(true);
  });

  test("grants administrators the complete permission set", () => {
    expect(hasPermission("admin", "employee:delete")).toBe(true);
    expect(getRolePermissions("admin")).toContain("admin:all");
  });

  test("normalizes database and legacy roles to least privilege", () => {
    expect(normalizeRole(" HR ")).toBe("hr");
    expect(normalizeRole("MANAGER")).toBe("manager");
    expect(normalizeRole("moderator")).toBe("employee");
    expect(normalizeRole("user")).toBe("employee");
    expect(normalizeRole(null)).toBe("employee");
  });

  test("keeps manager access team-scoped and payroll self-only", () => {
    const base = {
      role: "manager",
      actorEmployeeId: 10,
      targetEmployeeId: 20,
      targetManagerId: 10,
      actorOrganizationId: 1,
      targetOrganizationId: 1,
    } as const;

    expect(canAccessEmployeeResource({ ...base, resource: "profile" })).toBe(true);
    expect(canAccessEmployeeResource({ ...base, resource: "attendance" })).toBe(true);
    expect(canAccessEmployeeResource({ ...base, resource: "payroll" })).toBe(false);
    expect(
      canAccessEmployeeResource({
        ...base,
        resource: "profile",
        targetManagerId: 99,
      }),
    ).toBe(false);
  });

  test("never crosses organization boundaries", () => {
    expect(
      canAccessEmployeeResource({
        role: "admin",
        resource: "profile",
        actorEmployeeId: 1,
        targetEmployeeId: 2,
        actorOrganizationId: 1,
        targetOrganizationId: 2,
      }),
    ).toBe(false);
  });
});

describe("Better Auth account schema", () => {
  test("enforces the Better Auth 1.7 account identity contract", () => {
    const columns = getTableColumns(account);
    const indexes = getTableConfig(account).indexes;
    const identityIndex = indexes.find(
      (index) => index.config.name === "account_issuer_account_id_uidx",
    );

    expect(columns.issuer.name).toBe("issuer");
    expect(columns.issuer.notNull).toBe(true);
    expect(identityIndex?.config.unique).toBe(true);
    expect(identityIndex?.config.columns.map((column) => column.name)).toEqual([
      "issuer",
      "account_id",
    ]);
  });

  test("includes the admin plugin fields and required lookup indexes", () => {
    expect(Object.keys(getTableColumns(user))).toEqual(
      expect.arrayContaining(["role", "banned", "banReason", "banExpires"]),
    );
    expect(getTableConfig(session).indexes.map((index) => index.config.name)).toContain(
      "session_userId_idx",
    );
    expect(
      getTableConfig(verification).indexes.map((index) => index.config.name),
    ).toContain("verification_identifier_idx");
  });
});

describe("post-authentication routing", () => {
  test("routes only administrators to the protected admin area", () => {
    expect(getRoleLandingPath("admin")).toBe("/admin");
    expect(getRoleLandingPath("hr")).toBe("/dashboard");
    expect(getRoleLandingPath("manager")).toBe("/dashboard");
    expect(getRoleLandingPath("employee")).toBe("/dashboard");
  });

  test("does not trust legacy or unknown roles with privileged routing", () => {
    expect(getRoleLandingPath("user")).toBe("/dashboard");
    expect(getRoleLandingPath(null)).toBe("/dashboard");
  });

  test("enforces broad page access before APIs apply row-level scope", () => {
    expect(canAccessPage("employee", "/dashboard/people/profile")).toBe(true);
    expect(canAccessPage("employee", "/dashboard/people/settings")).toBe(true);
    expect(canAccessPage("employee", "/dashboard/people/settings/team")).toBe(false);
    expect(canAccessPage("manager", "/dashboard/people/settings/team")).toBe(true);
    expect(canAccessPage("hr", "/dashboard/people/onboarding")).toBe(true);
    expect(canAccessPage("manager", "/dashboard/people/onboarding")).toBe(false);
    expect(canAccessPage("hr", "/dashboard/people/billing")).toBe(false);
    expect(canAccessPage("admin", "/dashboard/people/billing")).toBe(true);
    expect(canAccessPage("employee", "/dashboard/people/42")).toBe(false);
    expect(canAccessPage("manager", "/dashboard/people/42")).toBe(true);
    expect(canAccessPage("employee", "/dashboard/my-team")).toBe(false);
    expect(canAccessPage("manager", "/dashboard/my-team")).toBe(true);
    expect(canAccessPage("manager", "/dashboard/payroll/periods")).toBe(false);
    expect(canAccessPage("hr", "/dashboard/payroll/periods")).toBe(true);
    expect(canAccessPage("hr", "/admin")).toBe(false);
    expect(canAccessPage("admin", "/admin")).toBe(true);
    expect(canAccessPage("hr", "/dashboard/roles")).toBe(false);
    expect(canAccessPage("admin", "/dashboard/roles")).toBe(true);
    expect(canAccessPage("employee", "/dashboard/attendance")).toBe(true);
    expect(canAccessPage("employee", "/dashboard/attendance/daily")).toBe(false);
    expect(canAccessPage("employee", "/dashboard/payroll")).toBe(true);
    expect(canAccessPage("employee", "/dashboard/work-schedules")).toBe(false);
    expect(canAccessPage("employee", "/dashboard/unknown-route")).toBe(false);
  });

  test("rejects external and auth-loop callback destinations", () => {
    expect(sanitizeCallbackPath("https://evil.example/steal")).toBe("/auth/redirect");
    expect(sanitizeCallbackPath("//evil.example/steal")).toBe("/auth/redirect");
    expect(sanitizeCallbackPath("/sign-in")).toBe("/auth/redirect");
    expect(sanitizeCallbackPath("/dashboard/attendance?week=current")).toBe(
      "/dashboard/attendance?week=current",
    );
  });
});
