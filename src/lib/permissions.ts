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
  | "leave:read:team"
  | "leave:read:any"
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
  | "approval:read"
  | "approval:manage:team"
  | "approval:manage";

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  employee: [
    "self:read",
    "self:update",
    "attendance:self",
    "leave:self",
    "leave:create",
    "payroll:read:self",
    "employee:read:self",
  ],
  manager: [
    "self:read",
    "self:update",
    "attendance:self",
    "attendance:read:team",
    "leave:self",
    "leave:create",
    "leave:read:team",
    "payroll:read:self",
    "employee:read:self",
    "employee:read:team",
    "approval:read",
    "approval:manage:team",
    "organization:read",
  ],
  hr: [
    "self:read",
    "self:update",
    "attendance:self",
    "attendance:read:any",
    "attendance:manage",
    "leave:self",
    "leave:create",
    "leave:read:any",
    "leave:manage",
    "payroll:read:self",
    "payroll:read:any",
    "payroll:manage",
    "employee:read:self",
    "employee:read:any",
    "employee:create",
    "employee:update",
    "organization:read",
    "approval:read",
    "approval:manage",
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
    "leave:read:team",
    "leave:read:any",
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
    "approval:read",
    "approval:manage:team",
    "approval:manage",
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
