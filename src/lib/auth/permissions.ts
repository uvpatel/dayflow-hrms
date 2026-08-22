export type AppRole = "admin" | "moderator" | "hr" | "manager" | "employee" | "user";

export type Permission =
  // Organization
  | "org:read"
  | "org:manage"
  | "department:read"
  | "department:manage"
  | "designation:read"
  | "designation:manage"
  | "location:read"
  | "location:manage"
  | "holiday:read"
  | "holiday:manage"
  | "schedule:read"
  | "schedule:manage"

  // Employee
  | "employee:read:self"
  | "employee:read:any"
  | "employee:create"
  | "employee:update"
  | "employee:delete"
  | "self:read"
  | "self:update"

  // Attendance
  | "attendance:read:self"
  | "attendance:read:any"
  | "attendance:self"
  | "attendance:manage"

  // Leave / Time Off
  | "leave:read:self"
  | "leave:read:any"
  | "leave:create"
  | "leave:update"
  | "leave:delete"
  | "leave:approve"
  | "leave:manage"

  // Approvals Workflow
  | "approval:read"
  | "approval:action"

  // Payroll
  | "payroll:read:self"
  | "payroll:read:any"
  | "payroll:manage"

  // Notifications & Audit
  | "notification:read"
  | "notification:manage"
  | "audit:read";

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  admin: [
    "org:read",
    "org:manage",
    "department:read",
    "department:manage",
    "designation:read",
    "designation:manage",
    "location:read",
    "location:manage",
    "holiday:read",
    "holiday:manage",
    "schedule:read",
    "schedule:manage",
    "employee:read:self",
    "employee:read:any",
    "employee:create",
    "employee:update",
    "employee:delete",
    "self:read",
    "self:update",
    "attendance:read:self",
    "attendance:read:any",
    "attendance:self",
    "attendance:manage",
    "leave:read:self",
    "leave:read:any",
    "leave:create",
    "leave:update",
    "leave:delete",
    "leave:approve",
    "leave:manage",
    "approval:read",
    "approval:action",
    "payroll:read:self",
    "payroll:read:any",
    "payroll:manage",
    "notification:read",
    "notification:manage",
    "audit:read",
  ],
  moderator: [
    "org:read",
    "org:manage",
    "department:read",
    "department:manage",
    "designation:read",
    "designation:manage",
    "location:read",
    "location:manage",
    "holiday:read",
    "holiday:manage",
    "schedule:read",
    "schedule:manage",
    "employee:read:self",
    "employee:read:any",
    "employee:create",
    "employee:update",
    "self:read",
    "self:update",
    "attendance:read:self",
    "attendance:read:any",
    "attendance:self",
    "attendance:manage",
    "leave:read:self",
    "leave:read:any",
    "leave:create",
    "leave:update",
    "leave:approve",
    "leave:manage",
    "approval:read",
    "approval:action",
    "payroll:read:self",
    "payroll:read:any",
    "notification:read",
    "notification:manage",
    "audit:read",
  ],
  hr: [
    "org:read",
    "department:read",
    "designation:read",
    "location:read",
    "holiday:read",
    "holiday:manage",
    "schedule:read",
    "schedule:manage",
    "employee:read:self",
    "employee:read:any",
    "employee:create",
    "employee:update",
    "self:read",
    "self:update",
    "attendance:read:self",
    "attendance:read:any",
    "attendance:self",
    "attendance:manage",
    "leave:read:self",
    "leave:read:any",
    "leave:create",
    "leave:update",
    "leave:approve",
    "leave:manage",
    "approval:read",
    "approval:action",
    "payroll:read:self",
    "payroll:read:any",
    "payroll:manage",
    "notification:read",
    "notification:manage",
    "audit:read",
  ],
  manager: [
    "org:read",
    "department:read",
    "designation:read",
    "location:read",
    "holiday:read",
    "schedule:read",
    "employee:read:self",
    "employee:read:any",
    "self:read",
    "self:update",
    "attendance:read:self",
    "attendance:read:any",
    "attendance:self",
    "leave:read:self",
    "leave:read:any",
    "leave:create",
    "leave:update",
    "leave:delete",
    "leave:approve",
    "approval:read",
    "approval:action",
    "payroll:read:self",
    "notification:read",
    "notification:manage",
  ],
  employee: [
    "org:read",
    "department:read",
    "designation:read",
    "location:read",
    "holiday:read",
    "schedule:read",
    "employee:read:self",
    "self:read",
    "self:update",
    "attendance:read:self",
    "attendance:self",
    "leave:read:self",
    "leave:create",
    "leave:update",
    "leave:delete",
    "payroll:read:self",
    "notification:read",
  ],
  user: [
    "org:read",
    "department:read",
    "designation:read",
    "location:read",
    "holiday:read",
    "employee:read:self",
    "self:read",
    "self:update",
    "attendance:read:self",
    "attendance:self",
    "leave:read:self",
    "leave:create",
    "payroll:read:self",
    "notification:read",
  ],
};

export function hasPermission(role: string | null | undefined, permission: Permission): boolean {
  const normalizedRole = (role?.toLowerCase() || "user") as AppRole;
  const permissions = ROLE_PERMISSIONS[normalizedRole] || ROLE_PERMISSIONS.user;
  return permissions.includes(permission);
}
