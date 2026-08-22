export const DEFAULT_AUTH_CALLBACK = "/auth/redirect";

const ALLOWED_CALLBACK_ROOTS = [
  "/dashboard",
  "/admin",
  "/employee",
  "/manager",
  "/hr",
  DEFAULT_AUTH_CALLBACK,
] as const;

function isAllowedCallbackPath(pathname: string): boolean {
  return ALLOWED_CALLBACK_ROOTS.some(
    (root) => pathname === root || pathname.startsWith(`${root}/`),
  );
}

/**
 * Accepts only same-application destinations. This value is safe to pass to
 * Better Auth and Next.js navigation without creating an open redirect.
 */
export function sanitizeCallbackPath(
  value: unknown,
  fallback = DEFAULT_AUTH_CALLBACK,
): string {
  if (typeof value !== "string") return fallback;

  const candidate = value.trim();
  if (
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(candidate)
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(candidate, "https://dayflow.invalid");
    if (parsed.origin !== "https://dayflow.invalid") return fallback;
    if (!isAllowedCallbackPath(parsed.pathname)) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function createAbsoluteCallbackURL(
  value: unknown,
  origin: string,
): string {
  const safePath = sanitizeCallbackPath(value);
  return new URL(safePath, origin).toString();
}
