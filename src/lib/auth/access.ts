export const AUTH_ACCESS_ISSUES = [
  "AUTH_REQUIRED",
  "EMPLOYEE_PROFILE_REQUIRED",
  "ACCOUNT_DISABLED",
] as const;

export type AuthAccessIssue = (typeof AUTH_ACCESS_ISSUES)[number];

type EmployeeAccessSubject = {
  employee: {
    employmentStatus: string;
  } | null;
};

const ALLOWED_EMPLOYMENT_STATUSES = new Set([
  "active",
  "onboarding",
  "notice_period",
]);

/**
 * Classifies whether an authenticated identity may enter the HRMS application.
 * Unknown employment states fail closed so a malformed record cannot gain
 * access accidentally.
 */
export function getAuthAccessIssue(
  context: EmployeeAccessSubject | null,
): AuthAccessIssue | null {
  if (!context) return "AUTH_REQUIRED";
  if (!context.employee) return "EMPLOYEE_PROFILE_REQUIRED";
  if (!ALLOWED_EMPLOYMENT_STATUSES.has(context.employee.employmentStatus)) {
    return "ACCOUNT_DISABLED";
  }
  return null;
}

const ACCESS_ERROR_MESSAGES: Record<AuthAccessIssue, string> = {
  AUTH_REQUIRED: "Authentication required to access this resource",
  EMPLOYEE_PROFILE_REQUIRED:
    "A linked employee profile is required to access Dayflow",
  ACCOUNT_DISABLED:
    "Your employee account has been deactivated. Please contact HR.",
};

export class AuthAccessError extends Error {
  readonly code: AuthAccessIssue;

  constructor(code: AuthAccessIssue) {
    super(ACCESS_ERROR_MESSAGES[code]);
    this.name = "AuthAccessError";
    this.code = code;
  }
}
