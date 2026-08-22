export type Role = "admin" | "hr" | "manager" | "employee";

export type Permission =
  | "admin:all"
  | "self:read"
  | "self:update"
  | "attendance:self"
  | "attendance:read:team"
  | "attendance:read:any"
  | "attendance:manage"
  | "leave:self"
  | "leave:create"
  | "leave:read:self"
  | "leave:read:team"
  | "leave:read:any"
  | "leave:update"
  | "leave:delete"
  | "leave:approve"
  | "leave:manage"
  | "payroll:read:self"
  | "payroll:read:any"
  | "payroll:manage"
  | "employee:read:self"
  | "employee:read:team"
  | "employee:read:any"
  | "employee:create"
  | "employee:update"
  | "employee:delete"
  | "organization:read"
  | "organization:manage"
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
  | "notification:read"
  | "notification:manage"
  | "audit:read"
  | "approval:read"
  | "approval:action"
  | "approval:manage:team"
  | "approval:manage";

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  employee: [
    "self:read",
    "self:update",
    "attendance:self",
    "leave:self",
    "leave:create",
    "leave:read:self",
    "payroll:read:self",
    "employee:read:self",
    "notification:read",
  ],
  manager: [
    "self:read",
    "self:update",
    "attendance:self",
    "attendance:read:team",
    "leave:self",
    "leave:create",
    "leave:read:self",
    "leave:read:team",
    "payroll:read:self",
    "employee:read:self",
    "employee:read:team",
    "approval:read",
    "approval:manage:team",
    "organization:read",
    "org:read",
    "department:read",
    "designation:read",
    "location:read",
    "holiday:read",
    "schedule:read",
    "notification:read",
  ],
  hr: [
    "self:read",
    "self:update",
    "attendance:self",
    "attendance:read:any",
    "attendance:manage",
    "leave:self",
    "leave:create",
    "leave:read:self",
    "leave:read:any",
    "leave:approve",
    "leave:update",
    "leave:delete",
    "leave:manage",
    "payroll:read:self",
    "payroll:read:any",
    "payroll:manage",
    "employee:read:self",
    "employee:read:any",
    "employee:create",
    "employee:update",
    "organization:read",
    "org:read",
    "department:read",
    "designation:read",
    "location:read",
    "holiday:read",
    "schedule:read",
    "notification:read",
    "notification:manage",
    "approval:read",
    "approval:manage",
    "approval:action",
  ],
  admin: [
    "admin:all",
    "self:read",
    "self:update",
    "attendance:self",
    "attendance:read:team",
    "attendance:read:any",
    "attendance:manage",
    "leave:self",
    "leave:create",
    "leave:read:self",
    "leave:read:team",
    "leave:read:any",
    "leave:update",
    "leave:delete",
    "leave:approve",
    "leave:manage",
    "payroll:read:self",
    "payroll:read:any",
    "payroll:manage",
    "employee:read:self",
    "employee:read:team",
    "employee:read:any",
    "employee:create",
    "employee:update",
    "employee:delete",
    "organization:read",
    "organization:manage",
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
    "notification:read",
    "notification:manage",
    "audit:read",
    "approval:read",
    "approval:manage:team",
    "approval:manage",
    "approval:action",
  ],
} as const;

export function getRolePermissions(role: Role): Permission[] {
  return [...(ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.employee)];
}

export function hasPermission(role: Role, permission: Permission): boolean {
  if (role === "admin") return true;
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  if (role === "admin") return true;
  return permissions.some((p) => hasPermission(role, p));
}
