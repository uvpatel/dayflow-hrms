import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
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
import { resolveTrustedOrigins } from "@/lib/auth/url";
import {
  classifyAuthFailure,
  logAuthDiagnostic,
  logBetterAuthMessage,
} from "@/lib/auth/diagnostics";
import { isActiveUserBan } from "@/lib/auth/bans";
import {
  buildGithubEmployeeProfile,
  forceDefaultAuthRole,
  isGithubOAuthCallbackPath,
} from "@/lib/auth/identity-policy";

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

const trustedOrigins = resolveTrustedOrigins();
const trustProxyHeaders = readBooleanSetting(
  process.env.AUTH_TRUST_PROXY_HEADERS,
  process.env.VERCEL === "1",
  "AUTH_TRUST_PROXY_HEADERS",
);

function configurationError(message: string): never {
  const error = new Error(`AUTH_CONFIGURATION_ERROR: ${message}`);
  logAuthDiagnostic("AUTH_CONFIGURATION_ERROR", {
    stage: "init",
    error,
  });
  throw error;
}

const emailProviderUrl = process.env.EMAIL_PROVIDER_API_URL?.trim();
const emailProviderKey = process.env.EMAIL_PROVIDER_API_KEY?.trim();
const emailFrom = process.env.EMAIL_FROM?.trim();

if (Boolean(emailProviderUrl) !== Boolean(emailProviderKey)) {
  configurationError(
    "EMAIL_PROVIDER_API_URL and EMAIL_PROVIDER_API_KEY must either both be configured or both be omitted.",
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
      configurationError(
        "EMAIL_PROVIDER_API_URL must be a valid HTTPS URL in production.",
      );
    }
  } catch {
    configurationError("EMAIL_PROVIDER_API_URL is not a valid URL.");
  }
}

if (isProduction && !requireEmailVerification) {
  configurationError(
    "AUTH_REQUIRE_EMAIL_VERIFICATION must be enabled in production.",
  );
}

if (
  isProduction &&
  requireEmailVerification &&
  (!emailProviderUrl || !emailProviderKey || !emailFrom)
) {
  configurationError(
    "Email verification is enabled, but EMAIL_PROVIDER_API_URL, EMAIL_PROVIDER_API_KEY, or EMAIL_FROM is not configured.",
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
      role: {
        type: ["admin", "hr", "user"],
        required: true,
        defaultValue: "user",
        input: false,
        returned: true,
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

      // GitHub's verified email is sufficient for identity creation. A
      // first-time OAuth identity is provisioned below with user-level access;
      // pre-existing credential users are linked by Better Auth itself.
      if (source.method === "oauth") return;

      const employeeNumber =
        typeof user.employeeNumber === "string"
          ? user.employeeNumber.trim().toUpperCase()
          : "";
      const conditions = [
        eq(employees.email, email),
        isNull(employees.userId),
      ];
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

      const [eligibleEmployee] = await db
        .select({ id: employees.id })
        .from(employees)
        .where(and(...conditions))
        .limit(1);
      if (!eligibleEmployee) {
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
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({
          data: forceDefaultAuthRole(user),
        }),
        after: async (createdUser, context) => {
          if (!isGithubOAuthCallbackPath(context?.path)) return;

          await db
            .insert(employees)
            .values(
              buildGithubEmployeeProfile({
                id: createdUser.id,
                name: createdUser.name,
                email: createdUser.email,
              }),
            )
            // A pre-provisioned employee with the same verified email is
            // claimed later by auth-context under the stored auth role. This
            // avoids a select-then-insert race and never auto-elevates access.
            .onConflictDoNothing({ target: employees.email });
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const [authUser] = await db
            .select({
              banned: schema.user.banned,
              banExpires: schema.user.banExpires,
            })
            .from(schema.user)
            .where(eq(schema.user.id, session.userId))
            .limit(1);

          if (!authUser?.banned) return;

          if (!isActiveUserBan(authUser)) {
            await db
              .update(schema.user)
              .set({
                banned: false,
                banReason: null,
                banExpires: null,
                updatedAt: new Date(),
              })
              .where(eq(schema.user.id, session.userId));
            return;
          }

          throw APIError.from("FORBIDDEN", {
            code: "BANNED_USER",
            message:
              "You have been banned from this application. Please contact support if you believe this is an error.",
          });
        },
      },
    },
  },
  socialProviders: {
    github: {
      clientId: serverEnv.GITHUB_CLIENT_ID,
      clientSecret: serverEnv.GITHUB_CLIENT_SECRET,
      requireEmailVerification: true,
    },
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
      disableImplicitLinking: false,
      requireLocalEmailVerified: true,
      allowDifferentEmails: false,
      updateUserInfoOnLink: false,
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
  secret: authSecret,
  baseURL: serverEnv.BETTER_AUTH_URL,
  trustedOrigins,
});
