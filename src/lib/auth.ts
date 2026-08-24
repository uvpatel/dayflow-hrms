import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins/admin";
import { after } from "next/server";
import { db } from "@/db";
import { employees } from "@/db/schema/employees";
import * as schema from "@/db/schema/auth-schema";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "@/lib/email/service";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { serverEnv } from "@/lib/env";
import {
  resolveAllowedAuthHosts,
  resolveTrustedOrigins,
} from "@/lib/auth/url";
import {
  classifyAuthFailure,
  logAuthDiagnostic,
  logBetterAuthMessage,
} from "@/lib/auth/diagnostics";

const isProduction = process.env.NODE_ENV === "production";
const authSecret = serverEnv.BETTER_AUTH_SECRET;

function readBooleanSetting(
  value: string | undefined,
  fallback: boolean,
  name: string,
): boolean {
  if (value == null || value.trim() === "") return fallback;

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;

  throw new Error(
    `AUTH_CONFIGURATION_ERROR: ${name} must be a boolean value.`,
  );
}

const requireEmailVerification = readBooleanSetting(
  process.env.AUTH_REQUIRE_EMAIL_VERIFICATION,
  true,
  "AUTH_REQUIRE_EMAIL_VERIFICATION",
);

if (isProduction && !requireEmailVerification) {
  throw new Error(
    "AUTH_CONFIGURATION_ERROR: AUTH_REQUIRE_EMAIL_VERIFICATION must be enabled in production.",
  );
}

const trustedOrigins = resolveTrustedOrigins();
const allowedHosts = resolveAllowedAuthHosts();
const trustProxyHeaders = readBooleanSetting(
  process.env.AUTH_TRUST_PROXY_HEADERS,
  process.env.VERCEL === "1",
  "AUTH_TRUST_PROXY_HEADERS",
);

// Better Auth 1.7 resolves only explicitly allowlisted request hosts. This is
// what keeps a preview/custom-domain OAuth state cookie and its callback on the
// same host. The canonical URL is still resolved once in lib/env.ts and is
// always included in the allowlist.
const baseURL = {
  allowedHosts,
  protocol: isProduction ? ("https" as const) : ("auto" as const),
};

const githubClientId = process.env.GITHUB_CLIENT_ID?.trim() || undefined;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET?.trim() || undefined;
const githubOAuthRequired =
  isProduction && process.env.VERCEL_ENV !== "preview";

if (Boolean(githubClientId) !== Boolean(githubClientSecret)) {
  throw new Error(
    "AUTH_CONFIGURATION_ERROR: GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must either both be configured or both be omitted.",
  );
}

if (githubOAuthRequired && (!githubClientId || !githubClientSecret)) {
  throw new Error(
    "AUTH_CONFIGURATION_ERROR: GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are required for the production Dayflow deployment.",
  );
}

const emailProviderUrl = process.env.EMAIL_PROVIDER_API_URL?.trim();
const emailProviderKey = process.env.EMAIL_PROVIDER_API_KEY?.trim();
const emailFrom = process.env.EMAIL_FROM?.trim();

if (Boolean(emailProviderUrl) !== Boolean(emailProviderKey)) {
  throw new Error(
    "AUTH_CONFIGURATION_ERROR: EMAIL_PROVIDER_API_URL and EMAIL_PROVIDER_API_KEY must either both be configured or both be omitted.",
  );
}

if (emailProviderUrl) {
  try {
    const parsedEmailProviderUrl = new URL(emailProviderUrl);
    if (
      !["http:", "https:"].includes(parsedEmailProviderUrl.protocol) ||
      parsedEmailProviderUrl.username ||
      parsedEmailProviderUrl.password ||
      (isProduction && parsedEmailProviderUrl.protocol !== "https:")
    ) {
      throw new Error("invalid email provider URL");
    }
  } catch {
    throw new Error(
      "AUTH_CONFIGURATION_ERROR: EMAIL_PROVIDER_API_URL must be a valid HTTPS URL in production.",
    );
  }
}

if (
  isProduction &&
  requireEmailVerification &&
  (!emailProviderUrl || !emailProviderKey || !emailFrom)
) {
  throw new Error(
    "AUTH_CONFIGURATION_ERROR: Email verification is enabled, so EMAIL_PROVIDER_API_URL, EMAIL_PROVIDER_API_KEY, and EMAIL_FROM are required in production.",
  );
}

function scheduleAuthEmail(
  stage: "password-reset" | "verification",
  send: () => Promise<unknown>,
): void {
  after(async () => {
    try {
      await send();
    } catch (error) {
      logAuthDiagnostic("AUTH_EMAIL_ERROR", {
        stage,
        error,
      });
    }
  });
}

export const auth = betterAuth({
  appName: "Dayflow",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: 60 * 30,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      scheduleAuthEmail("password-reset", () =>
        sendPasswordResetEmail(user.email, url, user.name),
      );
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url }) => {
      scheduleAuthEmail("verification", () =>
        sendVerificationEmail(user.email, url, user.name),
      );
    },
  },
  user: {
    additionalFields: {
      employeeNumber: {
        type: "string",
        required: false,
        input: true,
        returned: true,
        // The Drizzle adapter maps this property to the schema's
        // employeeNumber key; Drizzle handles the employee_number SQL column.
        transform: {
          input: (value) =>
            typeof value === "string" ? value.trim().toUpperCase() : value,
        },
        validator: {
          input: z.string().trim().min(2).max(64),
        },
      },
    },
    validateUserInfo: async ({ user, source }) => {
      if (source.action !== "create-user") return;
      if (source.method !== "email-password" && source.method !== "oauth") return;

      const email = typeof user.email === "string" ? user.email.toLowerCase().trim() : "";
      if (!email) {
        logAuthDiagnostic("AUTH_EMPLOYEE_LINK_ERROR", {
          level: "warn",
          stage: "validate-user-email",
          errorCode: "EMAIL_REQUIRED",
        });
        return {
          error: "EMAIL_REQUIRED",
          errorDescription: "A valid email address is required.",
        };
      }

      const employeeNumber =
        typeof user.employeeNumber === "string"
          ? user.employeeNumber.trim().toUpperCase()
          : "";
      const conditions = [
        eq(employees.email, email),
        isNull(employees.userId),
      ];
      if (source.method === "email-password") {
        if (!employeeNumber) {
          logAuthDiagnostic("AUTH_EMPLOYEE_LINK_ERROR", {
            level: "warn",
            stage: "validate-employee-number",
            errorCode: "EMPLOYEE_ID_REQUIRED",
          });
          return {
            error: "EMPLOYEE_ID_REQUIRED",
            errorDescription: "A valid pre-issued employee ID is required.",
          };
        }
        conditions.push(eq(employees.employeeNumber, employeeNumber));
      }

      const [eligibleEmployee] = await db
        .select({ id: employees.id })
        .from(employees)
        .where(and(...conditions))
        .limit(1);
      if (!eligibleEmployee) {
        if (source.method === "oauth") {
          logAuthDiagnostic("AUTH_EMPLOYEE_LINK_ERROR", {
            level: "warn",
            stage: "validate-oauth-employee",
            provider: "github",
            errorCode: "NO_MATCHING_EMPLOYEE",
          });
          return {
            error: "NO_MATCHING_EMPLOYEE",
            errorDescription:
              "No pre-registered employee profile was found for this GitHub account. Please contact HR.",
          };
        }
        logAuthDiagnostic("AUTH_EMPLOYEE_LINK_ERROR", {
          level: "warn",
          stage: "validate-credential-employee",
          errorCode: "EMPLOYEE_ID_MISMATCH",
        });
        return {
          error: "EMPLOYEE_ID_MISMATCH",
          errorDescription:
            "The employee ID and email do not match an available employee record.",
        };
      }
    },
  },
  plugins: [
    admin({
      // Public sign-up never grants elevated access. HR and admin roles are
      // assigned only by an authorized server-side role-management flow or seed.
      defaultRole: "employee",
      adminRoles: ["admin"],
    }),
  ],
  socialProviders: {
    ...(githubClientId && githubClientSecret
      ? {
          github: {
            clientId: githubClientId,
            clientSecret: githubClientSecret,
            requireEmailVerification: true,
            mapProfileToUser: (profile) => ({
              name: profile.name || profile.login || "User",
              email: profile.email,
              image: profile.avatar_url,
            }),
          },
        }
      : {}),
  },
  account: {
    encryptOAuthTokens: true,
    // OAuth state is short-lived and already protected by Better Auth's signed,
    // HTTP-only SameSite cookie. Keeping it out of PostgreSQL prevents the
    // initial provider redirect from depending on the verification table and
    // is safer during zero-downtime schema rollouts.
    storeStateStrategy: "cookie",
    accountLinking: {
      enabled: true,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    freshAge: 60 * 60,
  },
  rateLimit: {
    enabled: true,
    window: 10,
    max: 100,
    storage: "memory",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/sign-in/social": { window: 60, max: 10 },
      "/request-password-reset": { window: 60, max: 3 },
      "/send-verification-email": { window: 60, max: 3 },
    },
  },
  advanced: {
    useSecureCookies: isProduction,
    trustedProxyHeaders: trustProxyHeaders,
    disableCSRFCheck: false,
    disableOriginCheck: false,
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    },
  },
  logger: {
    disableColors: true,
    level: isProduction ? "warn" : "info",
    log: (level, message) => logBetterAuthMessage(level, message),
  },
  onAPIError: {
    onError: (error) => {
      logAuthDiagnostic(classifyAuthFailure(error), {
        stage: "api-handler",
        error,
      });
    },
  },
  ...(authSecret ? { secret: authSecret } : {}),
  baseURL,
  trustedOrigins,
});
