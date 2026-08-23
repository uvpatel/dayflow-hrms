import { describe, expect, test } from "bun:test";

import {
  AuthAccessError,
  getAuthAccessIssue,
} from "../src/lib/auth/access";
import { sanitizeCallbackPath } from "../src/lib/auth/redirects";

describe("protected authentication boundary", () => {
  test("requires a valid Better Auth session", () => {
    expect(getAuthAccessIssue(null)).toBe("AUTH_REQUIRED");
  });

  test("rejects authenticated identities without an employee link", () => {
    expect(getAuthAccessIssue({ employee: null })).toBe(
      "EMPLOYEE_PROFILE_REQUIRED",
    );
  });

  test("allows every supported working employment state", () => {
    for (const employmentStatus of [
      "active",
      "onboarding",
      "notice_period",
    ]) {
      expect(
        getAuthAccessIssue({ employee: { employmentStatus } }),
      ).toBeNull();
    }
  });

  test("fails closed for inactive or malformed employment states", () => {
    expect(
      getAuthAccessIssue({ employee: { employmentStatus: "inactive" } }),
    ).toBe("ACCOUNT_DISABLED");
    expect(
      getAuthAccessIssue({ employee: { employmentStatus: "unexpected" } }),
    ).toBe("ACCOUNT_DISABLED");
  });

  test("provides stable machine-readable access errors", () => {
    const error = new AuthAccessError("EMPLOYEE_PROFILE_REQUIRED");
    expect(error.name).toBe("AuthAccessError");
    expect(error.code).toBe("EMPLOYEE_PROFILE_REQUIRED");
    expect(error.message).toContain("linked employee profile");
  });
});

describe("GitHub OAuth & Better Auth provider integration", () => {
  test("safe callback sanitizer handles post-OAuth redirect targets", () => {
    expect(sanitizeCallbackPath("/dashboard")).toBe("/dashboard");
    expect(sanitizeCallbackPath("/admin")).toBe("/admin");
    expect(sanitizeCallbackPath("/dashboard/attendance")).toBe(
      "/dashboard/attendance",
    );
    expect(sanitizeCallbackPath("https://malicious.com")).toBe(
      "/auth/redirect",
    );
    expect(sanitizeCallbackPath("//malicious.com")).toBe("/auth/redirect");
    expect(sanitizeCallbackPath("javascript:alert(1)")).toBe("/auth/redirect");
  });
});

