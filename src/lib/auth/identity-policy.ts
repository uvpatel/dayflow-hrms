export const AUTH_ROLE_VALUES = ["admin", "hr", "user"] as const;

export type AuthRole = (typeof AUTH_ROLE_VALUES)[number];

export const DEFAULT_AUTH_ROLE: AuthRole = "user";
export const GITHUB_OAUTH_CALLBACK_PATH = "/callback/github";

/**
 * Better Auth merges this result over all user-creation input. Keeping the
 * role assignment in a server-owned hook ensures neither credential signup nor
 * OAuth profile data can grant a privileged role.
 */
export function forceDefaultAuthRole<T extends Record<string, unknown>>(
  user: T,
): T & { role: typeof DEFAULT_AUTH_ROLE } {
  return { ...user, role: DEFAULT_AUTH_ROLE };
}

export function isGithubOAuthCallbackPath(path: unknown): boolean {
  return path === GITHUB_OAUTH_CALLBACK_PATH;
}

type OAuthUserProfile = {
  id: string;
  name: string;
  email: string;
};

/**
 * Creates the minimum employee-domain profile required by the existing HRMS
 * for a first-time GitHub identity. It intentionally contains no organization,
 * employee number, or privileged role; HR/admin workflows can provision those
 * later.
 */
export function buildGithubEmployeeProfile(user: OAuthUserProfile) {
  const normalizedName = user.name.trim().replace(/\s+/g, " ");
  const [firstName = "GitHub", ...remainingName] = normalizedName
    ? normalizedName.split(" ")
    : [];

  return {
    userId: user.id,
    firstName,
    lastName: remainingName.join(" ") || "User",
    email: user.email.trim().toLowerCase(),
    role: "employee" as const,
    employmentStatus: "onboarding" as const,
  };
}
