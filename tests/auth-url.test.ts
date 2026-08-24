import { describe, expect, test } from "bun:test";

import {
  isSecureProductionAuthOrigin,
  normalizeAuthOrigin,
  resolveAllowedAuthHosts,
  resolveCanonicalAuthUrl,
  resolveTrustedOrigins,
  type AuthUrlEnvironment,
} from "../src/lib/auth/url";

const productionEnvironment = (
  overrides: AuthUrlEnvironment = {},
): AuthUrlEnvironment => ({
  NODE_ENV: "production",
  ...overrides,
});

describe("Better Auth origin normalization", () => {
  test("treats absent and blank values as unconfigured", () => {
    expect(normalizeAuthOrigin(undefined)).toBeUndefined();
    expect(normalizeAuthOrigin(null)).toBeUndefined();
    expect(normalizeAuthOrigin("")).toBeUndefined();
    expect(normalizeAuthOrigin("   ")).toBeUndefined();
    expect(normalizeAuthOrigin('"   "')).toBeUndefined();
  });

  test("unwraps quotes and reduces an application URL to its origin", () => {
    expect(
      normalizeAuthOrigin(
        '  "https://Dayflow.Example.com:443/api/auth/?next=1#callback"  ',
      ),
    ).toBe("https://dayflow.example.com");
    expect(
      normalizeAuthOrigin("'https://dayflow.example.com/dashboard/'"),
    ).toBe("https://dayflow.example.com");
    expect(normalizeAuthOrigin("https://dayflow.example.com:8443/api/auth")).toBe(
      "https://dayflow.example.com:8443",
    );
  });

  test("infers HTTPS for domains and HTTP only for loopback development hosts", () => {
    expect(normalizeAuthOrigin("dayflow.example.com/api/auth")).toBe(
      "https://dayflow.example.com",
    );
    expect(normalizeAuthOrigin("localhost:3000/api/auth")).toBe(
      "http://localhost:3000",
    );
    expect(normalizeAuthOrigin("127.0.0.1:3001")).toBe(
      "http://127.0.0.1:3001",
    );
    expect(normalizeAuthOrigin("127.0.0.2:3001")).toBe(
      "http://127.0.0.2:3001",
    );
    expect(normalizeAuthOrigin("localhost.:3000")).toBe(
      "http://localhost.:3000",
    );
    expect(normalizeAuthOrigin("[::1]:3000")).toBe("http://[::1]:3000");
  });

  test("rejects credentials, non-HTTP schemes, malformed URLs, and wildcards", () => {
    for (const candidate of [
      "ftp://dayflow.example.com",
      "file:///tmp/dayflow",
      "https://user:password@dayflow.example.com",
      "https://",
      "https://*.vercel.app",
      "https://day flow.example.com",
    ]) {
      expect(normalizeAuthOrigin(candidate)).toBeUndefined();
    }
  });
});

describe("canonical Better Auth URL resolution", () => {
  test("uses the documented priority without retaining paths or slashes", () => {
    expect(
      resolveCanonicalAuthUrl(
        productionEnvironment({
          BETTER_AUTH_URL: "https://auth.dayflow.example/api/auth/",
          VERCEL_PROJECT_PRODUCTION_URL: "dayflow.vercel.app",
          VERCEL_URL: "dayflow-git-a1b2c3-team.vercel.app",
        }),
      ),
    ).toBe("https://auth.dayflow.example");

    expect(
      resolveCanonicalAuthUrl(
        productionEnvironment({
          VERCEL_PROJECT_PRODUCTION_URL: "dayflow.vercel.app",
          VERCEL_URL: "dayflow-git-a1b2c3-team.vercel.app",
        }),
      ),
    ).toBe("https://dayflow.vercel.app");

    expect(
      resolveCanonicalAuthUrl(
        productionEnvironment({
          VERCEL_URL: "dayflow-git-a1b2c3-team.vercel.app",
        }),
      ),
    ).toBe("https://dayflow-git-a1b2c3-team.vercel.app");
  });

  test("uses localhost only outside production", () => {
    expect(resolveCanonicalAuthUrl({ NODE_ENV: "development" })).toBe(
      "http://localhost:3000",
    );
    expect(resolveCanonicalAuthUrl({ NODE_ENV: "test" })).toBe(
      "http://localhost:3000",
    );
    expect(resolveCanonicalAuthUrl(productionEnvironment())).toBeUndefined();
  });

  test("classifies only non-loopback HTTPS origins as production-safe", () => {
    expect(isSecureProductionAuthOrigin("https://dayflow.example.com")).toBe(
      true,
    );
    expect(isSecureProductionAuthOrigin("http://dayflow.example.com")).toBe(
      false,
    );
    expect(isSecureProductionAuthOrigin("https://localhost:3000")).toBe(false);
    expect(isSecureProductionAuthOrigin("https://127.0.0.1:3000")).toBe(false);
    expect(isSecureProductionAuthOrigin("https://127.0.0.2:3000")).toBe(false);
    expect(isSecureProductionAuthOrigin("https://localhost.:3000")).toBe(false);
    expect(isSecureProductionAuthOrigin("not a URL")).toBe(false);
  });

  test("fails fast when production has no canonical URL", () => {
    const result = Bun.spawnSync({
      cmd: [
        process.execPath,
        "--conditions=react-server",
        "-e",
        'await import("./src/lib/env.ts");',
      ],
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: "production",
        BETTER_AUTH_URL: "",
        VERCEL_PROJECT_PRODUCTION_URL: "",
        VERCEL_URL: "",
        BETTER_AUTH_SECRET: "test-only-secret-with-at-least-32-characters",
      },
      stdout: "pipe",
      stderr: "pipe",
    });

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr.toString()).toContain(
      "AUTH_CONFIGURATION_ERROR: A canonical auth URL is required in production",
    );
  });
});

describe("Better Auth trusted origins", () => {
  test("returns exact configured, production, and preview origins", () => {
    const environment = productionEnvironment({
      BETTER_AUTH_URL: "https://app.dayflow.example/api/auth",
      VERCEL_PROJECT_PRODUCTION_URL: "dayflow.vercel.app",
      VERCEL_BRANCH_URL: "dayflow-git-main-team.vercel.app",
      VERCEL_URL: "dayflow-git-a1b2c3-team.vercel.app",
      BETTER_AUTH_TRUSTED_ORIGINS:
        'https://login.dayflow.example/, "https://support.dayflow.example/api/auth"',
    });

    expect(resolveTrustedOrigins(environment)).toEqual([
      "https://app.dayflow.example",
      "https://dayflow.vercel.app",
      "https://dayflow-git-main-team.vercel.app",
      "https://dayflow-git-a1b2c3-team.vercel.app",
      "https://login.dayflow.example",
      "https://support.dayflow.example",
    ]);
  });

  test("does not add a universal or broad Vercel wildcard by default", () => {
    const origins = resolveTrustedOrigins(
      productionEnvironment({
        BETTER_AUTH_URL: "https://app.dayflow.example",
        VERCEL_PROJECT_PRODUCTION_URL: "dayflow.vercel.app",
        VERCEL_URL: "dayflow-git-a1b2c3-team.vercel.app",
      }),
    );

    expect(origins).toEqual([
      "https://app.dayflow.example",
      "https://dayflow.vercel.app",
      "https://dayflow-git-a1b2c3-team.vercel.app",
    ]);
    expect(origins.some((origin) => origin.includes("*"))).toBe(false);
  });

  test("allows only explicitly configured, scoped HTTPS wildcard patterns", () => {
    const origins = resolveTrustedOrigins(
      productionEnvironment({
        BETTER_AUTH_URL: "https://app.dayflow.example",
        BETTER_AUTH_TRUSTED_ORIGINS:
          "https://dayflow-*.vercel.app,https://*.preview.dayflow.example",
      }),
    );

    expect(origins).toEqual([
      "https://app.dayflow.example",
      "https://dayflow-*.vercel.app",
      "https://*.preview.dayflow.example",
    ]);
  });

  test("rejects insecure, scheme-less, malformed, and overly broad wildcards", () => {
    for (const configuredOrigin of [
      "*",
      "https://*",
      "https://*.vercel.app",
      "*.dayflow.example",
      "http://*.dayflow.example",
      "https://*.localhost",
      "https://*.*.com",
      "https://*.dayflow.example/api/auth",
      "https://*.dayflow.example?preview=1",
    ]) {
      expect(() =>
        resolveTrustedOrigins(
          productionEnvironment({
            BETTER_AUTH_URL: "https://app.dayflow.example",
            BETTER_AUTH_TRUSTED_ORIGINS: configuredOrigin,
          }),
        ),
      ).toThrow("AUTH_CONFIGURATION_ERROR");
    }
  });

  test("rejects non-HTTPS exact origins in production", () => {
    for (const configuredOrigin of [
      "dayflow.example.com",
      "http://dayflow.example.com",
      "http://localhost:3000",
    ]) {
      expect(() =>
        resolveTrustedOrigins(
          productionEnvironment({
            BETTER_AUTH_URL: "https://app.dayflow.example",
            BETTER_AUTH_TRUSTED_ORIGINS: configuredOrigin,
          }),
        ),
      ).toThrow("AUTH_CONFIGURATION_ERROR");
    }
  });

  test("adds loopback origins only outside production", () => {
    expect(resolveTrustedOrigins({ NODE_ENV: "development" })).toEqual([
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
    ]);

    expect(
      resolveTrustedOrigins(
        productionEnvironment({
          BETTER_AUTH_URL: "https://app.dayflow.example",
        }),
      ),
    ).toEqual(["https://app.dayflow.example"]);
  });
});

describe("Better Auth request-host allowlist", () => {
  test("derives lowercase exact hosts and ports from validated origins", () => {
    const environment = productionEnvironment({
      BETTER_AUTH_URL: "https://App.Dayflow.Example:8443/api/auth",
      VERCEL_PROJECT_PRODUCTION_URL: "Dayflow.Vercel.App",
      VERCEL_URL: "Dayflow-Git-A1B2C3-Team.Vercel.App",
      BETTER_AUTH_TRUSTED_ORIGINS:
        "https://login.dayflow.example,https://dayflow-*.vercel.app",
    });

    expect(resolveAllowedAuthHosts(environment)).toEqual([
      "app.dayflow.example:8443",
      "dayflow.vercel.app",
      "dayflow-git-a1b2c3-team.vercel.app",
      "login.dayflow.example",
      "dayflow-*.vercel.app",
    ]);
  });

  test("inherits trusted-origin rejection instead of widening the host set", () => {
    expect(() =>
      resolveAllowedAuthHosts(
        productionEnvironment({
          BETTER_AUTH_URL: "https://app.dayflow.example",
          BETTER_AUTH_TRUSTED_ORIGINS: "https://*.vercel.app",
        }),
      ),
    ).toThrow("AUTH_CONFIGURATION_ERROR");
  });
});
