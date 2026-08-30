/**
 * Canonical URL and trusted-origin resolution for Better Auth.
 *
 * Server code must use one canonical origin. Browser code intentionally does
 * not import this module; it calls the same-origin `/api/auth` endpoint.
 */

export type AuthUrlEnvironment = {
  BETTER_AUTH_URL?: string;
  BETTER_AUTH_TRUSTED_ORIGINS?: string;
  NODE_ENV?: string;
  VERCEL_BRANCH_URL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
  VERCEL_URL?: string;
};

function unwrapEnvironmentValue(value?: string | null): string | undefined {
  if (value == null) return undefined;

  let result = value.trim();
  if (!result) return undefined;

  if (
    (result.startsWith('"') && result.endsWith('"')) ||
    (result.startsWith("'") && result.endsWith("'"))
  ) {
    result = result.slice(1, -1).trim();
  }

  return result || undefined;
}

function isLoopbackHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.+$/, "");
  const unbracketed = normalized.replace(/^\[|\]$/g, "");
  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    /^127(?:\.\d{1,3}){3}$/.test(normalized) ||
    unbracketed === "::1" ||
    unbracketed.startsWith("::ffff:127.") ||
    /^::ffff:7f[\da-f]{2}:/.test(unbracketed)
  );
}

export function normalizeAuthOrigin(value?: string | null): string | undefined {
  const unwrapped = unwrapEnvironmentValue(value);
  if (!unwrapped) return undefined;

  const explicitScheme = /^([a-z][a-z\d+.-]*):\/\//i.exec(unwrapped)?.[1];
  if (explicitScheme && !/^https?$/i.test(explicitScheme)) return undefined;

  try {
    const url = new URL(explicitScheme ? unwrapped : `https://${unwrapped}`);

    if (!["http:", "https:"].includes(url.protocol)) return undefined;
    if (url.username || url.password) return undefined;
    if (url.hostname.includes("*") || url.hostname.includes("?")) {
      return undefined;
    }

    if (!explicitScheme && isLoopbackHostname(url.hostname)) {
      url.protocol = "http:";
    }

    return url.origin;
  } catch {
    return undefined;
  }
}

export function isSecureProductionAuthOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return url.protocol === "https:" && !isLoopbackHostname(url.hostname);
  } catch {
    return false;
  }
}

export function resolveCanonicalAuthUrl(
  environment: AuthUrlEnvironment = process.env,
): string | undefined {
  return normalizeAuthOrigin(environment.BETTER_AUTH_URL);
}

function normalizeTrustedOriginPattern(
  value: string,
  allowHttp: boolean,
): string | undefined {
  const unwrapped = unwrapEnvironmentValue(value);
  if (!unwrapped) return undefined;

  // Better Auth 1.7 also reads BETTER_AUTH_TRUSTED_ORIGINS directly. In
  // production, requiring the scheme on the raw value prevents a scheme-less
  // wildcard from silently matching both HTTP and HTTPS.
  if (!allowHttp && !/^https:\/\//i.test(unwrapped)) return undefined;
  if (unwrapped.includes("?")) return undefined;

  if (!unwrapped.includes("*")) {
    const normalized = normalizeAuthOrigin(unwrapped);
    if (!normalized) return undefined;
    if (!allowHttp && !isSecureProductionAuthOrigin(normalized)) return undefined;
    return normalized;
  }

  // Better Auth 1.7 supports wildcard origins. Keep configured wildcards
  // protocol-specific and scoped to a real parent domain; never accept `*`.
  const withProtocol = /^https?:\/\//i.test(unwrapped)
    ? unwrapped
    : `https://${unwrapped}`;

  try {
    const url = new URL(withProtocol);
    const concreteLabels = url.hostname
      .split(".")
      .filter((label) => label && !label.includes("*"));

    if (url.username || url.password) return undefined;
    if (url.pathname !== "/" || url.search || url.hash) return undefined;
    if (!["http:", "https:"].includes(url.protocol)) return undefined;
    if (!allowHttp && url.protocol !== "https:") return undefined;
    if (!/^[a-z\d.*-]+$/i.test(url.hostname)) return undefined;
    if (concreteLabels.length < 2) return undefined;

    // A project-specific pattern such as dayflow-*.vercel.app is supported,
    // but trusting every Vercel tenant would turn another tenant into a valid
    // callback/origin source.
    if (/^\*+\.vercel\.app$/i.test(url.hostname)) return undefined;

    return `${url.protocol}//${url.host}`;
  } catch {
    return undefined;
  }
}

export function resolveTrustedOrigins(
  environment: AuthUrlEnvironment = process.env,
): string[] {
  const origins = new Set<string>();
  const isProduction = environment.NODE_ENV === "production";
  const canonicalAuthUrl = resolveCanonicalAuthUrl(environment);
  const isStrictProduction =
    isProduction &&
    canonicalAuthUrl !== undefined &&
    isSecureProductionAuthOrigin(canonicalAuthUrl);

  if (canonicalAuthUrl) origins.add(canonicalAuthUrl);

  const configuredOrigins =
    environment.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") ?? [];
  for (const configuredOrigin of configuredOrigins) {
    if (!configuredOrigin.trim()) continue;

    const normalized = normalizeTrustedOriginPattern(
      configuredOrigin,
      !isStrictProduction,
    );
    if (!normalized) {
      throw new Error(
        "AUTH_CONFIGURATION_ERROR: BETTER_AUTH_TRUSTED_ORIGINS contains an invalid or insecure origin.",
      );
    }
    origins.add(normalized);
  }

  return [...origins];
}

/**
 * Better Auth 1.7 can resolve its URL from the request, but only after the
 * request host matches this allowlist. This keeps OAuth callbacks and
 * host-only state cookies on the same explicitly trusted deployment host.
 */
export function resolveAllowedAuthHosts(
  environment: AuthUrlEnvironment = process.env,
): string[] {
  return resolveTrustedOrigins(environment).map((origin) => {
    if (origin.includes("*") || origin.includes("?")) {
      return origin.replace(/^https?:\/\//i, "").split("/")[0]!.toLowerCase();
    }

    return new URL(origin).host.toLowerCase();
  });
}
