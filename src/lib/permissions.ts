export const APP_ROLES = ["admin", "hr", "manager", "employee"] as const;

export type Role = (typeof APP_ROLES)[number];

export type Permission =
  | "admin:all"
  | "self:read"
  | "self:update"
  | "attendance:self"
  | "attendance:read:self"
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

const EMPLOYEE_PERMISSIONS = [
  "self:read",
  "self:update",
  "attendance:self",
  "attendance:read:self",
  "leave:self",
  "leave:create",
  "leave:read:self",
  "leave:update",
  "leave:delete",
  "payroll:read:self",
  "employee:read:self",
  "organization:read",
  "org:read",
  "department:read",
  "designation:read",
  "location:read",
  "holiday:read",
  "schedule:read",
  "notification:read",
] as const satisfies readonly Permission[];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  employee: EMPLOYEE_PERMISSIONS,
  manager: [
    ...EMPLOYEE_PERMISSIONS,
    "attendance:read:team",
    "leave:read:team",
    "employee:read:team",
    "approval:read",
    "approval:manage:team",
  ],
  hr: [
    ...EMPLOYEE_PERMISSIONS,
    "attendance:read:any",
    "attendance:manage",
    "leave:read:any",
    "leave:approve",
    "leave:manage",
    "payroll:read:any",
    "payroll:manage",
    "employee:read:any",
    "employee:create",
    "employee:update",
    "notification:manage",
    "audit:read",
    "approval:read",
    "approval:manage",
    "approval:action",
  ],
  admin: [
    ...EMPLOYEE_PERMISSIONS,
    "admin:all",
    "attendance:read:team",
    "attendance:read:any",
    "attendance:manage",
    "leave:read:team",
    "leave:read:any",
    "leave:approve",
    "leave:manage",
    "payroll:read:any",
    "payroll:manage",
    "employee:read:team",
    "employee:read:any",
    "employee:create",
    "employee:update",
    "employee:delete",
    "organization:manage",
    "org:manage",
    "department:manage",
    "designation:manage",
    "location:manage",
    "holiday:manage",
    "schedule:manage",
    "notification:manage",
    "audit:read",
    "approval:read",
    "approval:manage:team",
    "approval:manage",
    "approval:action",
  ],
} as const;

/**
 * Converts database, Better Auth, and legacy role values to the four Dayflow
 * roles. Unknown values deliberately receive employee access.
 */
export function normalizeRole(role: unknown): Role {
  if (typeof role !== "string") return "employee";

  const candidate = role.trim().toLowerCase();
  return isRole(candidate) ? candidate : "employee";
}

export function isRole(role: unknown): role is Role {
  return (
    typeof role === "string" &&
    (APP_ROLES as readonly string[]).includes(role)
  );
}

export function getRolePermissions(role: unknown): Permission[] {
  return [...ROLE_PERMISSIONS[normalizeRole(role)]];
}

export function hasPermission(role: unknown, permission: Permission): boolean {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === "admin") return true;
  return ROLE_PERMISSIONS[normalizedRole].includes(permission);
}

export function hasAnyPermission(
  role: unknown,
  permissions: readonly Permission[],
): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

export type EmployeeResource = "profile" | "attendance" | "leave" | "payroll";
export type ResourceAccessScope = "self" | "team" | "any";

/** Returns the maximum row scope a role may receive for an employee resource. */
export function getEmployeeResourceScope(
  role: unknown,
  resource: EmployeeResource,
): ResourceAccessScope {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "admin" || normalizedRole === "hr") return "any";
  if (normalizedRole === "manager" && resource !== "payroll") return "team";
  return "self";
}

export interface EmployeeResourceAccessInput {
  role: unknown;
  resource: EmployeeResource;
  actorEmployeeId: number | null | undefined;
  targetEmployeeId: number | null | undefined;
  targetManagerId?: number | null;
  actorOrganizationId?: number | null;
  targetOrganizationId?: number | null;
}

/**
 * Shared row-level decision for employee-owned data. API/service code must pass
 * the manager relationship read from the database, never a client-provided ID.
 */
export function canAccessEmployeeResource({
  role,
  resource,
  actorEmployeeId,
  targetEmployeeId,
  targetManagerId,
  actorOrganizationId,
  targetOrganizationId,
}: EmployeeResourceAccessInput): boolean {
  if (actorEmployeeId == null || targetEmployeeId == null) return false;

  if (
    actorOrganizationId != null &&
    targetOrganizationId != null &&
    actorOrganizationId !== targetOrganizationId
  ) {
    return false;
  }

  if (actorEmployeeId === targetEmployeeId) return true;

  const scope = getEmployeeResourceScope(role, resource);
  if (scope === "any") return true;
  return scope === "team" && targetManagerId === actorEmployeeId;
}

type RoutePolicy = {
  path: string;
  roles: readonly Role[];
  exact?: boolean;
};

const ALL_ROLES: readonly Role[] = APP_ROLES;
const MANAGEMENT_ROLES: readonly Role[] = ["manager", "hr", "admin"];
const HR_ROLES: readonly Role[] = ["hr", "admin"];

/**
 * Page-level visibility policy. Row-level checks remain mandatory in APIs.
 * More-specific paths intentionally precede their parent route.
 */
export const PAGE_ROUTE_POLICIES: readonly RoutePolicy[] = [
  { path: "/admin", roles: ["admin"] },
  { path: "/hr", roles: HR_ROLES },
  { path: "/manager", roles: MANAGEMENT_ROLES },
  { path: "/employee", roles: ALL_ROLES },
  { path: "/dashboard/people/profile", roles: ALL_ROLES },
  { path: "/dashboard/people/settings", roles: ALL_ROLES },
  { path: "/dashboard/people/billing", roles: ALL_ROLES },
  { path: "/dashboard/people/onboarding", roles: HR_ROLES },
  { path: "/dashboard/people", roles: MANAGEMENT_ROLES },
  { path: "/dashboard/approvals", roles: MANAGEMENT_ROLES },
  { path: "/dashboard/payroll/periods", roles: HR_ROLES },
  { path: "/dashboard/payroll/salary-structures", roles: HR_ROLES },
  { path: "/dashboard/reports", roles: MANAGEMENT_ROLES },
  { path: "/dashboard/audit-logs", roles: HR_ROLES },
  { path: "/dashboard/organization/roles", roles: ["admin"] },
  { path: "/dashboard/settings/roles", roles: ["admin"] },
  { path: "/dashboard", roles: ALL_ROLES },
] as const;

function matchesRoute(pathname: string, policy: RoutePolicy): boolean {
  if (pathname === policy.path) return true;
  return !policy.exact && pathname.startsWith(`${policy.path}/`);
}

/**
 * Returns whether a role may render a protected application page. Unknown
 * routes are denied; public routes should not call this helper.
 */
export function canAccessPage(role: unknown, rawPathname: string): boolean {
  const pathname = rawPathname.split(/[?#]/, 1)[0] || "/";
  const policy = PAGE_ROUTE_POLICIES.find((candidate) =>
    matchesRoute(pathname, candidate),
  );

  return policy ? policy.roles.includes(normalizeRole(role)) : false;
}
