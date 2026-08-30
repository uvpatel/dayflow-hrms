import { describe, expect, it } from "bun:test";
import {
  APP_ROLES,
  APP_ACCESS_ROLES,
  ROLE_PERMISSIONS,
  normalizeRole,
  isRole,
} from "@/lib/permissions";

describe("Permissions & RBAC Domain Tests", () => {
  it("should export defined workforce roles", () => {
    expect(APP_ROLES).toContain("admin");
    expect(APP_ROLES).toContain("hr");
    expect(APP_ROLES).toContain("manager");
    expect(APP_ROLES).toContain("employee");
  });

  it("should export defined access roles", () => {
    expect(APP_ACCESS_ROLES).toContain("admin");
    expect(APP_ACCESS_ROLES).toContain("hr");
    expect(APP_ACCESS_ROLES).toContain("user");
  });

  it("should normalize roles correctly", () => {
    expect(normalizeRole("admin")).toBe("admin");
    expect(normalizeRole("hr")).toBe("hr");
    expect(normalizeRole("manager")).toBe("manager");
    expect(normalizeRole("employee")).toBe("employee");
    expect(normalizeRole("user")).toBe("employee");
    expect(normalizeRole(null)).toBe("employee");
    expect(normalizeRole(undefined)).toBe("employee");
    expect(normalizeRole("unknown_tier")).toBe("employee");
  });

  it("should validate isRole helper", () => {
    expect(isRole("admin")).toBe(true);
    expect(isRole("hr")).toBe(true);
    expect(isRole("manager")).toBe(true);
    expect(isRole("employee")).toBe(true);
    expect(isRole("superuser")).toBe(false);
    expect(isRole(123)).toBe(false);
  });

  it("should grant progressive permissions across tiers", () => {
    const employeePerms = ROLE_PERMISSIONS.employee;
    const managerPerms = ROLE_PERMISSIONS.manager;
    const hrPerms = ROLE_PERMISSIONS.hr;
    const adminPerms = ROLE_PERMISSIONS.admin;

    // Self permissions
    expect(employeePerms).toContain("self:read");
    expect(employeePerms).toContain("attendance:self");
    expect(employeePerms).toContain("leave:self");

    // Manager permissions
    expect(managerPerms).toContain("attendance:read:team");
    expect(managerPerms).toContain("leave:read:team");
    expect(managerPerms).toContain("approval:read");

    // HR permissions
    expect(hrPerms).toContain("employee:read:any");
    expect(hrPerms).toContain("leave:approve");
    expect(hrPerms).toContain("payroll:manage");

    // Admin permissions
    expect(adminPerms).toContain("admin:all");
    expect(adminPerms).toContain("employee:delete");
    expect(adminPerms).toContain("organization:manage");
  });
});
