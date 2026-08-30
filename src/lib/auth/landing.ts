import {
  normalizeAccessRole,
  type AccessRole,
} from "@/lib/permissions";

const ROLE_LANDING_PATHS: Record<AccessRole, string> = {
  admin: "/admin",
  hr: "/hr",
  user: "/employee",
};

/**
 * Resolves the shared password/GitHub callback destination from a
 * server-derived role. Legacy employee and manager values use the user tier.
 */
export function getRoleLandingPath(role: string | null | undefined): string {
  return ROLE_LANDING_PATHS[normalizeAccessRole(role)];
}
