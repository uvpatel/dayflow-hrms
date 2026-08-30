import { describe, expect, it } from "bun:test";
import { normalizeAuthOrigin, isSecureProductionAuthOrigin, resolveTrustedOrigins } from "@/lib/auth/url";

describe("Auth URL & Origin Resolution Tests", () => {
  it("should normalize valid HTTP and HTTPS origins", () => {
    expect(normalizeAuthOrigin("http://localhost:3000")).toBe("http://localhost:3000");
    expect(normalizeAuthOrigin("https://dayflow.dev")).toBe("https://dayflow.dev");
    expect(normalizeAuthOrigin("https://preview.dayflow.dev/")).toBe("https://preview.dayflow.dev");
  });

  it("should reject wildcard or invalid scheme URLs", () => {
    expect(normalizeAuthOrigin("https://*.dayflow.dev")).toBeUndefined();
    expect(normalizeAuthOrigin("ftp://ftp.example.com")).toBeUndefined();
    expect(normalizeAuthOrigin("javascript:void(0)")).toBeUndefined();
  });

  it("should correctly identify secure production origins", () => {
    expect(isSecureProductionAuthOrigin("https://dayflow.dev")).toBe(true);
    expect(isSecureProductionAuthOrigin("https://app.dayflow.dev")).toBe(true);
    expect(isSecureProductionAuthOrigin("http://localhost:3000")).toBe(false);
    expect(isSecureProductionAuthOrigin("http://127.0.0.1:3000")).toBe(false);
  });

  it("should resolve trusted origins from environment", () => {
    const origins = resolveTrustedOrigins({
      BETTER_AUTH_URL: "http://localhost:3000",
      BETTER_AUTH_TRUSTED_ORIGINS: "https://staging.dayflow.dev,https://admin.dayflow.dev",
      NODE_ENV: "development",
    });

    expect(origins).toContain("http://localhost:3000");
    expect(origins).toContain("https://staging.dayflow.dev");
    expect(origins).toContain("https://admin.dayflow.dev");
  });
});
