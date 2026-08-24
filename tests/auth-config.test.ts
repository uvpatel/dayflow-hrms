import { describe, expect, test } from "bun:test";

function importProductionAuth(overrides: Record<string, string> = {}) {
  return Bun.spawnSync({
    cmd: [
      process.execPath,
      "--conditions=react-server",
      "-e",
      'await import("./src/lib/auth.ts");',
    ],
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "production",
      NEXT_PHASE: "",
      VERCEL: "1",
      VERCEL_PROJECT_PRODUCTION_URL: "",
      VERCEL_BRANCH_URL: "",
      VERCEL_URL: "",
      DATABASE_URL: "postgresql://user:password@localhost/dayflow",
      BETTER_AUTH_URL: "https://app.dayflow.example",
      BETTER_AUTH_SECRET: "test-only-secret-with-at-least-32-characters",
      BETTER_AUTH_TRUSTED_ORIGINS: "https://app.dayflow.example",
      AUTH_TRUST_PROXY_HEADERS: "",
      AUTH_REQUIRE_EMAIL_VERIFICATION: "true",
      GITHUB_CLIENT_ID: "test-github-client-id",
      GITHUB_CLIENT_SECRET: "test-github-client-secret",
      EMAIL_PROVIDER_API_URL: "https://email.dayflow.example/send",
      EMAIL_PROVIDER_API_KEY: "test-email-provider-key",
      EMAIL_FROM: "notifications@dayflow.example",
      ...overrides,
    },
    stdout: "pipe",
    stderr: "pipe",
  });
}

describe("production auth configuration", () => {
  test("initializes with secure production verification configured", () => {
    const result = importProductionAuth();

    expect(result.exitCode).toBe(0);
  });

  test("fails fast when email verification is disabled in production", () => {
    const result = importProductionAuth({
      AUTH_REQUIRE_EMAIL_VERIFICATION: "false",
    });

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr.toString()).toContain("AUTH_CONFIGURATION_ERROR");
    expect(result.stderr.toString()).toContain(
      "AUTH_REQUIRE_EMAIL_VERIFICATION must be enabled in production",
    );
  });

  test("fails fast when required verification delivery is unavailable", () => {
    const result = importProductionAuth({
      AUTH_REQUIRE_EMAIL_VERIFICATION: "true",
      EMAIL_PROVIDER_API_URL: "",
      EMAIL_PROVIDER_API_KEY: "",
      EMAIL_FROM: "",
    });

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr.toString()).toContain("AUTH_CONFIGURATION_ERROR");
    expect(result.stderr.toString()).toContain(
      "Email verification is enabled",
    );
  });

  test("fails fast on an incomplete GitHub credential pair", () => {
    const result = importProductionAuth({
      GITHUB_CLIENT_ID: "configured-client-id",
      GITHUB_CLIENT_SECRET: "",
    });

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr.toString()).toContain("AUTH_CONFIGURATION_ERROR");
    expect(result.stderr.toString()).toContain("must either both be configured");
  });

  test("fails fast when production GitHub OAuth is disabled", () => {
    const result = importProductionAuth({
      GITHUB_CLIENT_ID: "",
      GITHUB_CLIENT_SECRET: "",
    });

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr.toString()).toContain("AUTH_CONFIGURATION_ERROR");
    expect(result.stderr.toString()).toContain(
      "required for the production Dayflow deployment",
    );
  });
});
