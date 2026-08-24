import { describe, expect, test } from "bun:test";

import {
  AuthAccessError,
  getAuthAccessIssue,
} from "../src/lib/auth/access";
import {
  DEFAULT_AUTH_CALLBACK,
  sanitizeCallbackPath,
} from "../src/lib/auth/redirects";

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
      expect(getAuthAccessIssue({ employee: { employmentStatus } })).toBeNull();
    }
  });

  test("fails closed for disabled, terminated, and unknown states", () => {
    for (const employmentStatus of [
      "inactive",
      "terminated",
      "suspended",
      "",
      "unexpected",
    ]) {
      expect(getAuthAccessIssue({ employee: { employmentStatus } })).toBe(
        "ACCOUNT_DISABLED",
      );
    }
  });

  test("provides stable machine-readable access errors", () => {
    const error = new AuthAccessError("EMPLOYEE_PROFILE_REQUIRED");

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("AuthAccessError");
    expect(error.code).toBe("EMPLOYEE_PROFILE_REQUIRED");
    expect(error.message).toContain("linked employee profile");
  });
});

describe("OAuth callback sanitizer", () => {
  test("preserves only approved same-application destinations", () => {
    expect(sanitizeCallbackPath("/dashboard")).toBe("/dashboard");
    expect(sanitizeCallbackPath("/admin/users?page=2#roles")).toBe(
      "/admin/users?page=2#roles",
    );
    expect(sanitizeCallbackPath("/employee")).toBe("/employee");
    expect(sanitizeCallbackPath("/manager/team")).toBe("/manager/team");
    expect(sanitizeCallbackPath("/hr/reports")).toBe("/hr/reports");
    expect(sanitizeCallbackPath("/auth/redirect")).toBe("/auth/redirect");
  });

  test("rejects external, scheme-relative, and executable destinations", () => {
    for (const callback of [
      "https://malicious.example/steal",
      "http://malicious.example/steal",
      "//malicious.example/steal",
      "///malicious.example/steal",
      "javascript:alert(1)",
      "data:text/html,test",
      "\\\\malicious.example\\steal",
    ]) {
      expect(sanitizeCallbackPath(callback)).toBe(DEFAULT_AUTH_CALLBACK);
    }
  });

  test("rejects auth loops, unregistered paths, and malformed input", () => {
    for (const callback of [
      "",
      "   ",
      "/sign-in",
      "/sign-up",
      "/api/auth/get-session",
      "/unknown",
      "/dashboard\\malicious",
      "/dashboard\u0000/attendance",
    ]) {
      expect(sanitizeCallbackPath(callback)).toBe(DEFAULT_AUTH_CALLBACK);
    }

    expect(sanitizeCallbackPath(undefined)).toBe(DEFAULT_AUTH_CALLBACK);
    expect(sanitizeCallbackPath({ path: "/dashboard" })).toBe(
      DEFAULT_AUTH_CALLBACK,
    );
  });

  test("uses a caller-provided safe fallback", () => {
    expect(sanitizeCallbackPath("https://malicious.example", "/dashboard")).toBe(
      "/dashboard",
    );
  });
});
