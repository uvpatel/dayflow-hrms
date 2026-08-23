import { describe, expect, test } from "bun:test";

import {
  AuthAccessError,
  getAuthAccessIssue,
} from "../src/lib/auth/access";

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
