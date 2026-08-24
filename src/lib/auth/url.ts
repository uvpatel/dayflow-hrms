/**
 * URL normalization and resolution utilities for Better Auth.
 * Handles production edge cases including missing protocols, trailing slashes,
 * whitespace/quotes, wildcard origins (e.g. Vercel preview deploys),
 * and platform environment variables (Vercel, custom domains, localhost).
 */

export function normalizeAuthOrigin(value?: string | null): string | undefined {
  if (value == null) return undefined;
  let trimmed = value.trim();
  if (!trimmed) return undefined;

  // Remove surrounding single or double quotes
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  if (!trimmed) return undefined;

  // If already starts with a protocol
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      return url.origin;
    } catch {
      return undefined;
    }
  }

  // Infer protocol: http for localhost/127.0.0.1 loopback, https for domains
  const isLoopback =
    trimmed.startsWith("localhost") ||
    trimmed.startsWith("127.0.0.1") ||
    trimmed.startsWith("[::1]");
  const scheme = isLoopback ? "http://" : "https://";

  try {
    const url = new URL(`${scheme}${trimmed}`);
    return url.origin;
  } catch {
    return undefined;
  }
}

export function resolveCanonicalAuthUrl(): string | undefined {
  // 1. Explicit BETTER_AUTH_URL
  const fromAuthUrl = normalizeAuthOrigin(process.env.BETTER_AUTH_URL);
  if (fromAuthUrl) return fromAuthUrl;

  // 2. Vercel project production domain
  const fromVercelProd = normalizeAuthOrigin(
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  );
  if (fromVercelProd) return fromVercelProd;

  // 3. Vercel deployment URL
  const fromVercelUrl = normalizeAuthOrigin(process.env.VERCEL_URL);
  if (fromVercelUrl) return fromVercelUrl;

  // 4. In development / non-production, fallback to localhost:3000
  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  return undefined;
}

export function resolveTrustedOrigins(): string[] {
  const origins = new Set<string>();

  // 1. Always include standard local development / test origins
  origins.add("http://localhost:3000");
  origins.add("http://127.0.0.1:3000");
  origins.add("http://localhost:3001");

  // 2. Add canonical baseURL if resolved
  const canonicalUrl = resolveCanonicalAuthUrl();
  if (canonicalUrl) {
    origins.add(canonicalUrl);
  }

  // 3. Add Vercel system environment origins if present
  const vercelProd = normalizeAuthOrigin(
    process.env.BETTER_AUTH_URL,
  );
  if (vercelProd) origins.add(vercelProd);

  const vercelUrl = normalizeAuthOrigin(process.env.BETTER_AUTH_URL);
  if (vercelUrl) origins.add(vercelUrl);

  // 4. Always trust Vercel preview wildcard patterns
  origins.add("*.vercel.app");
  origins.add("https://*.vercel.app");

  // 5. Parse BETTER_AUTH_TRUSTED_ORIGINS
  const rawTrustedOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS;
  if (rawTrustedOrigins) {
    const candidates = rawTrustedOrigins.split(",");
    for (const raw of candidates) {
      let candidate = raw.trim();
      if (!candidate) continue;

      if (
        (candidate.startsWith('"') && candidate.endsWith('"')) ||
        (candidate.startsWith("'") && candidate.endsWith("'"))
      ) {
        candidate = candidate.slice(1, -1).trim();
      }
      if (!candidate) continue;

      // Handle wildcard patterns (e.g. *.example.com or https://*.example.com)
      if (candidate.includes("*")) {
        origins.add(candidate);
        if (
          !candidate.startsWith("http://") &&
          !candidate.startsWith("https://")
        ) {
          origins.add(`https://${candidate}`);
        }
      } else {
        const normalized = normalizeAuthOrigin(candidate);
        if (normalized) {
          origins.add(normalized);
        }
      }
    }
  }

  return Array.from(origins);
}
