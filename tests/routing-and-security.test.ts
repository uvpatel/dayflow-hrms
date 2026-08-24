import { describe, expect, test } from "bun:test";

import {
  canAccessEmployeeResource,
  canAccessPage,
  PAGE_ROUTE_POLICIES,
  type AppRole,
} from "../src/lib/permissions";
import { sanitizeCallbackPath, DEFAULT_AUTH_CALLBACK } from "../src/lib/auth/redirects";
import { AuthAccessError, getAuthAccessIssue } from "../src/lib/auth/access";

describe("complete RBAC page matrix across all registered route policies", () => {
  const roles: AppRole[] = ["admin", "hr", "manager", "employee"];

  test("admin has access to every single registered page policy", () => {
    for (const policy of PAGE_ROUTE_POLICIES) {
      expect(canAccessPage("admin", policy.path)).toBe(true);
    }
  });

  test("employee cannot access restricted management or administration routes", () => {
    const restrictedRoutes = [
      "/admin",
      "/admin/audit-logs",
      "/admin/settings",
      "/dashboard/roles",
      "/dashboard/organization/roles",
      "/dashboard/organization/departments",
      "/dashboard/organization/designations",
      "/dashboard/organization/locations",
      "/dashboard/departments",
      "/dashboard/designations",
      "/dashboard/office-locations",
      "/dashboard/work-schedules",
      "/dashboard/audit-logs",
      "/dashboard/my-team",
      "/dashboard/approvals",
      "/dashboard/reports",
      "/dashboard/payroll/periods",
      "/dashboard/payroll/salary-structures",
      "/dashboard/people/onboarding",
      "/dashboard/people/billing",
      "/dashboard/people/42",
      "/dashboard/attendance/daily",
      "/dashboard/attendance/weekly",
    ];

    for (const route of restrictedRoutes) {
      expect(canAccessPage("employee", route)).toBe(false);
    }
  });

  test("manager can access team and approvals but not company payroll or admin settings", () => {
    // Accessible to manager
    expect(canAccessPage("manager", "/dashboard/my-team")).toBe(true);
    expect(canAccessPage("manager", "/dashboard/approvals")).toBe(true);
    expect(canAccessPage("manager", "/dashboard/reports")).toBe(true);
    expect(canAccessPage("manager", "/dashboard/people/42")).toBe(true);
    expect(canAccessPage("manager", "/dashboard/people/settings/team")).toBe(true);
    expect(canAccessPage("manager", "/dashboard/attendance/daily")).toBe(true);
    expect(canAccessPage("manager", "/dashboard/attendance/weekly")).toBe(true);

    // Forbidden for manager
    expect(canAccessPage("manager", "/admin")).toBe(false);
    expect(canAccessPage("manager", "/dashboard/roles")).toBe(false);
    expect(canAccessPage("manager", "/dashboard/organization/roles")).toBe(false);
    expect(canAccessPage("manager", "/dashboard/payroll/periods")).toBe(false);
    expect(canAccessPage("manager", "/dashboard/payroll/salary-structures")).toBe(false);
    expect(canAccessPage("manager", "/dashboard/people/onboarding")).toBe(false);
    expect(canAccessPage("manager", "/dashboard/people/billing")).toBe(false);
    expect(canAccessPage("manager", "/dashboard/audit-logs")).toBe(false);
    expect(canAccessPage("manager", "/dashboard/work-schedules")).toBe(false);
  });

  test("hr can access organizational operations and payroll but not admin or billing", () => {
    // Accessible to HR
    expect(canAccessPage("hr", "/dashboard/organization")).toBe(true);
    expect(canAccessPage("hr", "/dashboard/organization/departments")).toBe(true);
    expect(canAccessPage("hr", "/dashboard/work-schedules")).toBe(true);
    expect(canAccessPage("hr", "/dashboard/payroll/periods")).toBe(true);
    expect(canAccessPage("hr", "/dashboard/payroll/salary-structures")).toBe(true);
    expect(canAccessPage("hr", "/dashboard/people/onboarding")).toBe(true);
    expect(canAccessPage("hr", "/dashboard/audit-logs")).toBe(true);
    expect(canAccessPage("hr", "/dashboard/approvals")).toBe(true);
    expect(canAccessPage("hr", "/dashboard/reports")).toBe(true);

    // Forbidden for HR
    expect(canAccessPage("hr", "/admin")).toBe(false);
    expect(canAccessPage("hr", "/dashboard/roles")).toBe(false);
    expect(canAccessPage("hr", "/dashboard/organization/roles")).toBe(false);
    expect(canAccessPage("hr", "/dashboard/people/billing")).toBe(false);
  });

  test("all roles can access personal self-service routes", () => {
    const selfRoutes = [
      "/dashboard",
      "/dashboard/attendance",
      "/dashboard/attendance/corrections",
      "/dashboard/time-off",
      "/dashboard/time-off/apply",
      "/dashboard/time-off/balance",
      "/dashboard/payroll",
      "/dashboard/notifications",
      "/dashboard/people/profile",
      "/dashboard/people/settings",
      "/dashboard/organization",
      "/dashboard/holidays",
    ];

    for (const role of roles) {
      for (const route of selfRoutes) {
        expect(canAccessPage(role, route)).toBe(true);
      }
    }
  });
});

describe("deep row-level access and tenant boundaries", () => {
  const allRoles: AppRole[] = ["admin", "hr", "manager", "employee"];

  test("cross-tenant access is unconditionally blocked for all roles", () => {
    for (const role of allRoles) {
      expect(
        canAccessEmployeeResource({
          role,
          resource: "profile",
          actorEmployeeId: 1,
          targetEmployeeId: 2,
          actorOrganizationId: 100,
          targetOrganizationId: 200,
        }),
      ).toBe(false);
    }
  });

  test("self access is permitted for own employee record", () => {
    expect(
      canAccessEmployeeResource({
        role: "employee",
        resource: "profile",
        actorEmployeeId: 5,
        targetEmployeeId: 5,
        actorOrganizationId: 1,
        targetOrganizationId: 1,
      }),
    ).toBe(true);

    expect(
      canAccessEmployeeResource({
        role: "employee",
        resource: "payroll",
        actorEmployeeId: 5,
        targetEmployeeId: 5,
        actorOrganizationId: 1,
        targetOrganizationId: 1,
      }),
    ).toBe(true);
  });

  test("employee cannot access peer employee record in the same tenant", () => {
    expect(
      canAccessEmployeeResource({
        role: "employee",
        resource: "profile",
        actorEmployeeId: 5,
        targetEmployeeId: 6,
        actorOrganizationId: 1,
        targetOrganizationId: 1,
      }),
    ).toBe(false);
  });

  test("manager can access direct report profiles and attendance but never payroll", () => {
    const managerContext = {
      role: "manager" as const,
      actorEmployeeId: 10,
      targetEmployeeId: 20,
      targetManagerId: 10,
      actorOrganizationId: 1,
      targetOrganizationId: 1,
    };

    expect(canAccessEmployeeResource({ ...managerContext, resource: "profile" })).toBe(true);
    expect(canAccessEmployeeResource({ ...managerContext, resource: "attendance" })).toBe(true);
    expect(canAccessEmployeeResource({ ...managerContext, resource: "leaves" })).toBe(true);
    expect(canAccessEmployeeResource({ ...managerContext, resource: "payroll" })).toBe(false);
  });

  test("manager cannot access non-report employees in the same tenant", () => {
    const nonReportContext = {
      role: "manager" as const,
      actorEmployeeId: 10,
      targetEmployeeId: 30,
      targetManagerId: 99,
      actorOrganizationId: 1,
      targetOrganizationId: 1,
    };

    expect(canAccessEmployeeResource({ ...nonReportContext, resource: "profile" })).toBe(false);
    expect(canAccessEmployeeResource({ ...nonReportContext, resource: "attendance" })).toBe(false);
  });
});

describe("security classifications & auth errors", () => {
  test("getAuthAccessIssue accurately classifies auth missing", () => {
    expect(getAuthAccessIssue(null)).toBe("AUTH_REQUIRED");
    expect(getAuthAccessIssue(undefined)).toBe("AUTH_REQUIRED");
  });

  test("getAuthAccessIssue accurately classifies missing employee profile", () => {
    expect(getAuthAccessIssue({ employee: null })).toBe("EMPLOYEE_PROFILE_REQUIRED");
    expect(getAuthAccessIssue({ employee: undefined })).toBe("EMPLOYEE_PROFILE_REQUIRED");
  });

  test("getAuthAccessIssue detects terminated or disabled accounts", () => {
    expect(getAuthAccessIssue({ employee: { employmentStatus: "terminated" } })).toBe("ACCOUNT_DISABLED");
    expect(getAuthAccessIssue({ employee: { employmentStatus: "suspended" } })).toBe("ACCOUNT_DISABLED");
    expect(getAuthAccessIssue({ employee: { employmentStatus: "inactive" } })).toBe("ACCOUNT_DISABLED");
  });

  test("AuthAccessError error codes and descriptions", () => {
    const err1 = new AuthAccessError("AUTH_REQUIRED");
    expect(err1.code).toBe("AUTH_REQUIRED");

    const err2 = new AuthAccessError("ACCOUNT_DISABLED");
    expect(err2.code).toBe("ACCOUNT_DISABLED");
  });
});

describe("open redirect prevention & callback sanitizer", () => {
  test("sanitizes disallowed paths to default callback", () => {
    expect(sanitizeCallbackPath("")).toBe(DEFAULT_AUTH_CALLBACK);
    expect(sanitizeCallbackPath("https://google.com")).toBe(DEFAULT_AUTH_CALLBACK);
    expect(sanitizeCallbackPath("//google.com")).toBe(DEFAULT_AUTH_CALLBACK);
    expect(sanitizeCallbackPath("///google.com")).toBe(DEFAULT_AUTH_CALLBACK);
    expect(sanitizeCallbackPath("javascript:void(0)")).toBe(DEFAULT_AUTH_CALLBACK);
    expect(sanitizeCallbackPath("data:text/html,test")).toBe(DEFAULT_AUTH_CALLBACK);
    expect(sanitizeCallbackPath("/sign-in")).toBe(DEFAULT_AUTH_CALLBACK);
    expect(sanitizeCallbackPath("/sign-up")).toBe(DEFAULT_AUTH_CALLBACK);
    expect(sanitizeCallbackPath("/sign-in?callbackUrl=/dashboard")).toBe(DEFAULT_AUTH_CALLBACK);
  });

  test("preserves valid application destinations and query parameters", () => {
    expect(sanitizeCallbackPath("/dashboard")).toBe("/dashboard");
    expect(sanitizeCallbackPath("/dashboard/attendance")).toBe("/dashboard/attendance");
    expect(sanitizeCallbackPath("/dashboard/time-off/apply")).toBe("/dashboard/time-off/apply");
    expect(sanitizeCallbackPath("/admin")).toBe("/admin");
    expect(sanitizeCallbackPath("/dashboard/reports?tab=payroll")).toBe("/dashboard/reports?tab=payroll");
  });
});
