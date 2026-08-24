import "server-only";

export type AuthDiagnosticCode =
  | "AUTH_API_ERROR"
  | "AUTH_CONFIGURATION_ERROR"
  | "AUTH_DATABASE_ERROR"
  | "AUTH_EMAIL_ERROR"
  | "AUTH_EMPLOYEE_LINK_ERROR"
  | "AUTH_ORIGIN_ERROR"
  | "AUTH_OAUTH_CALLBACK_ERROR"
  | "AUTH_SESSION_ERROR";

type AuthDiagnosticLevel = "info" | "warn" | "error";

type AuthDiagnosticContext = {
  stage: string;
  level?: AuthDiagnosticLevel;
  provider?: "github";
  error?: unknown;
  errorCode?: string;
};

const SAFE_VALUE = /^[a-z\d_.:/-]{1,100}$/i;

function safeValue(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return SAFE_VALUE.test(value) ? value : undefined;
}

function errorName(error: unknown): string | undefined {
  if (!(error instanceof Error)) return undefined;
  return safeValue(error.name);
}

function errorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;

  const candidate = error as {
    code?: unknown;
    status?: unknown;
    body?: { code?: unknown };
  };

  return (
    safeValue(candidate.body?.code) ??
    safeValue(candidate.code) ??
    safeValue(candidate.status)
  );
}

function redactDevelopmentMessage(message: string): string {
  return message
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[REDACTED_DATABASE_URL]")
    .replace(/bearer\s+[^\s]+/gi, "Bearer [REDACTED]")
    .replace(
      /([?&](?:token|code|state|secret|password|access_token|refresh_token|session_token)=)[^&\s]+/gi,
      "$1[REDACTED]",
    )
    .replace(
      /(["']?(?:password|secret|token|api[_-]?key|client[_-]?secret|access[_-]?token|refresh[_-]?token|session[_-]?token)["']?\s*[:=]\s*["']?)[^"'\s,}]+/gi,
      "$1[REDACTED]",
    )
    .replace(/((?:set-)?cookie\s*:\s*)[^\r\n]+/gi, "$1[REDACTED]")
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[REDACTED_EMAIL]")
    .slice(0, 1_000);
}

function messageFromError(error: unknown): string | undefined {
  if (!(error instanceof Error) || !error.message) return undefined;
  return redactDevelopmentMessage(error.message);
}

/**
 * Emits a fixed event code and allowlisted metadata only. Production output
 * never serializes an Error, request, URL, header, cookie, token, email, or
 * database connection string.
 */
export function logAuthDiagnostic(
  event: AuthDiagnosticCode,
  context: AuthDiagnosticContext,
): void {
  const level = context.level ?? "error";
  const payload = {
    event,
    environment:
      safeValue(process.env.VERCEL_ENV ?? process.env.NODE_ENV) ?? "unknown",
    stage: safeValue(context.stage) ?? "unknown",
    ...(context.provider ? { provider: context.provider } : {}),
    ...(safeValue(context.errorCode) || errorCode(context.error)
      ? { errorCode: safeValue(context.errorCode) ?? errorCode(context.error) }
      : {}),
    ...(errorName(context.error)
      ? { errorName: errorName(context.error) }
      : {}),
    ...(process.env.NODE_ENV !== "production" &&
    messageFromError(context.error)
      ? { detail: messageFromError(context.error) }
      : {}),
  };

  const serialized = JSON.stringify(payload);
  if (level === "info") {
    console.info(serialized);
  } else if (level === "warn") {
    console.warn(serialized);
  } else {
    console.error(serialized);
  }
}

export function classifyAuthFailure(error: unknown): AuthDiagnosticCode {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (/database|drizzle|neon|postgres|sql|relation|column/.test(message)) {
    return "AUTH_DATABASE_ERROR";
  }
  if (/origin|csrf|redirect/.test(message)) return "AUTH_ORIGIN_ERROR";
  if (/oauth|callback|github|\bstate\b/.test(message)) {
    return "AUTH_OAUTH_CALLBACK_ERROR";
  }
  if (/session|cookie/.test(message)) return "AUTH_SESSION_ERROR";
  if (/configuration|config|base url|secret|environment/.test(message)) {
    return "AUTH_CONFIGURATION_ERROR";
  }
  return "AUTH_API_ERROR";
}

export function logBetterAuthMessage(
  level: "debug" | "info" | "warn" | "error",
  message: string,
): void {
  if (level === "debug") return;

  logAuthDiagnostic(classifyAuthFailure(new Error(message)), {
    level: level === "info" ? "info" : level,
    stage: "better-auth",
    ...(process.env.NODE_ENV !== "production"
      ? { error: new Error(redactDevelopmentMessage(message)) }
      : {}),
  });
}
