import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import {
  normalizeAuthOrigin,
  resolveCanonicalAuthUrl,
  resolveTrustedOrigins,
} from "../src/lib/auth/url";

describe("Better Auth URL normalization & production edge cases", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("normalizeAuthOrigin", () => {
    test("handles undefined, null, and empty strings gracefully", () => {
      expect(normalizeAuthOrigin(undefined)).toBeUndefined();
      expect(normalizeAuthOrigin(null)).toBeUndefined();
      expect(normalizeAuthOrigin("")).toBeUndefined();
      expect(normalizeAuthOrigin("   ")).toBeUndefined();
    });

    test("strips quotes, whitespace, paths, and trailing slashes", () => {
      expect(
        normalizeAuthOrigin(' "https://dayflow-hrms-eight.vercel.app/" '),
      ).toBe("https://dayflow-hrms-eight.vercel.app");

      expect(
        normalizeAuthOrigin("'https://dayflow-hrms-eight.vercel.app/api/auth'"),
      ).toBe("https://dayflow-hrms-eight.vercel.app");

      expect(
        normalizeAuthOrigin("https://dayflow-hrms-eight.vercel.app/dashboard?tab=1#sec"),
      ).toBe("https://dayflow-hrms-eight.vercel.app");
    });

    test("infers protocol when omitted", () => {
      expect(normalizeAuthOrigin("dayflow-hrms-eight.vercel.app")).toBe(
        "https://dayflow-hrms-eight.vercel.app",
      );
      expect(normalizeAuthOrigin("localhost:3000")).toBe("http://localhost:3000");
      expect(normalizeAuthOrigin("127.0.0.1:3000")).toBe("http://127.0.0.1:3000");
    });

    test("preserves non-standard ports", () => {
      expect(normalizeAuthOrigin("https://dayflow.internal:8443/auth")).toBe(
        "https://dayflow.internal:8443",
      );
      expect(normalizeAuthOrigin("localhost:8080")).toBe("http://localhost:8080");
    });
  });

  describe("resolveCanonicalAuthUrl", () => {
    test("prioritizes BETTER_AUTH_URL over Vercel env vars", () => {
      process.env.BETTER_AUTH_URL = "https://custom.dayflow.app/";
      process.env.VERCEL_PROJECT_PRODUCTION_URL = "dayflow-prod.vercel.app";
      process.env.VERCEL_URL = "dayflow-preview-123.vercel.app";

      expect(resolveCanonicalAuthUrl()).toBe("https://custom.dayflow.app");
    });

    test("falls back to VERCEL_PROJECT_PRODUCTION_URL when BETTER_AUTH_URL is omitted", () => {
      delete process.env.BETTER_AUTH_URL;
      process.env.VERCEL_PROJECT_PRODUCTION_URL = "dayflow-hrms-eight.vercel.app";
      process.env.VERCEL_URL = "dayflow-preview-123.vercel.app";

      expect(resolveCanonicalAuthUrl()).toBe(
        "https://dayflow-hrms-eight.vercel.app",
      );
    });

    test("falls back to VERCEL_URL when earlier vars are omitted", () => {
      delete process.env.BETTER_AUTH_URL;
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      process.env.VERCEL_URL = "dayflow-preview-123.vercel.app";

      expect(resolveCanonicalAuthUrl()).toBe(
        "https://dayflow-preview-123.vercel.app",
      );
    });

    test("falls back to localhost:3000 in non-production environments", () => {
      delete process.env.BETTER_AUTH_URL;
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      delete process.env.VERCEL_URL;
      process.env.NODE_ENV = "development";

      expect(resolveCanonicalAuthUrl()).toBe("http://localhost:3000");
    });
  });

  describe("resolveTrustedOrigins", () => {
    test("includes loopback origins, wildcard vercel pattern, and canonical url", () => {
      process.env.BETTER_AUTH_URL = "https://dayflow-hrms-eight.vercel.app";
      delete process.env.BETTER_AUTH_TRUSTED_ORIGINS;

      const origins = resolveTrustedOrigins();
      expect(origins).toContain("http://localhost:3000");
      expect(origins).toContain("http://127.0.0.1:3000");
      expect(origins).toContain("https://dayflow-hrms-eight.vercel.app");
      expect(origins).toContain("*.vercel.app");
      expect(origins).toContain("https://*.vercel.app");
    });

    test("handles comma-separated BETTER_AUTH_TRUSTED_ORIGINS with wildcards without crashing new URL", () => {
      process.env.BETTER_AUTH_TRUSTED_ORIGINS =
        "*.mycompany.com, https://custom-app.com/, 'https://other-app.com' ";

      const origins = resolveTrustedOrigins();
      expect(origins).toContain("*.mycompany.com");
      expect(origins).toContain("https://*.mycompany.com");
      expect(origins).toContain("https://custom-app.com");
      expect(origins).toContain("https://other-app.com");
    });
  });
});
