import { describe, expect, test } from "bun:test";
import { getTableColumns } from "drizzle-orm";

import { getRolePermissions, hasPermission } from "../src/lib/permissions";
import { account } from "../src/db/schema/auth-schema";
import { getRoleLandingPath } from "../src/lib/auth/landing";

describe("role permissions", () => {
  test("does not allow an employee to access another employee's payroll", () => {
    expect(hasPermission("employee", "payroll:read:any")).toBe(false);
    expect(hasPermission("employee", "payroll:read:self")).toBe(true);
  });

  test("allows HR to manage payroll but not delete employees", () => {
    expect(hasPermission("hr", "payroll:manage")).toBe(true);
    expect(hasPermission("hr", "employee:delete")).toBe(false);
  });

  test("keeps approval and audit actions limited to privileged roles", () => {
    expect(hasPermission("manager", "approval:action")).toBe(false);
    expect(hasPermission("hr", "approval:action")).toBe(true);
    expect(hasPermission("hr", "audit:read")).toBe(false);
    expect(hasPermission("admin", "audit:read")).toBe(true);
  });

  test("grants administrators the complete permission set", () => {
    expect(hasPermission("admin", "employee:delete")).toBe(true);
    expect(getRolePermissions("admin")).toContain("admin:all");
  });
});

describe("Better Auth account schema", () => {
  test("maps the issuer column required for OAuth account lookup", () => {
    expect(getTableColumns(account).issuer.name).toBe("issuer");
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
});
