import { normalizeRole, type Role } from "@/lib/permissions";

const ROLE_LANDING_PATHS: Record<Role, string> = {
  admin: "/admin",
  hr: "/dashboard",
  manager: "/dashboard",
  employee: "/dashboard",
};

/**
 * Resolves a post-authentication destination from a server-derived role.
 * Unknown or legacy Better Auth roles intentionally receive employee access.
 */
export function getRoleLandingPath(role: string | null | undefined): string {
  return ROLE_LANDING_PATHS[normalizeRole(role)];
}
