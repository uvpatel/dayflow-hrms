import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins/admin";
import { after } from "next/server";
import { db } from "@/db";
import { employees } from "@/db/schema/employees";
import * as schema from "@/db/schema/auth-schema";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email/service";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

const isProduction = process.env.NODE_ENV === "production";
const authSecret = process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET;

function resolveBaseURL(): string {
  const explicit =
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL;

  if (explicit?.trim()) {
    const trimmed = explicit.trim();
    const url = new URL(
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`,
    );
    return url.origin;
  }

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercelHost?.trim()) {
    const trimmed = vercelHost.trim();
    const url = new URL(
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`,
    );
    return url.origin;
  }

  return isProduction ? "" : "http://localhost:3000";
}

const configuredBaseURL = resolveBaseURL();

if (isProduction && (!authSecret || authSecret.length < 32)) {
  throw new Error(
    "BETTER_AUTH_SECRET is required in production and must contain at least 32 high-entropy characters.",
  );
}

if (isProduction && !configuredBaseURL) {
  throw new Error("BETTER_AUTH_URL is required in production.");
}

function readBooleanSetting(
  value: string | undefined,
  fallback: boolean,
  name: string,
): boolean {
  if (value == null || value.trim() === "") return fallback;

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;

  throw new Error(`${name} must be a boolean value.`);
}

const requireEmailVerification = readBooleanSetting(
  process.env.AUTH_REQUIRE_EMAIL_VERIFICATION,
  isProduction,
  "AUTH_REQUIRE_EMAIL_VERIFICATION",
);

const baseURL = configuredBaseURL || "http://localhost:3000";
const trustedOrigins = new Set<string>();

for (const candidate of [
  baseURL,
  ...(isProduction
    ? []
    : ["http://localhost:3000", "http://127.0.0.1:3000"]),
  ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS || "").split(","),
]) {
  const value = candidate.trim();
  if (!value) continue;

  try {
    trustedOrigins.add(new URL(value).origin);
  } catch {
    throw new Error(`Invalid Better Auth trusted origin: ${value}`);
  }
}

const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

if (Boolean(githubClientId) !== Boolean(githubClientSecret)) {
  throw new Error(
    "GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must either both be configured or both be omitted.",
  );
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
      after(() => sendPasswordResetEmail(user.email, url, user.name));
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url }) => {
      after(() => sendVerificationEmail(user.email, url, user.name));
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
          return {
            error: "NO_MATCHING_EMPLOYEE",
            errorDescription:
              `No pre-registered employee profile found for this GitHub account email (${email}). Please contact HR.`,
          };
        }
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
    storeStateStrategy: "database",
    accountLinking: {
      enabled: true,
      trustedProviders: ["github"],
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
    disableCSRFCheck: false,
    disableOriginCheck: false,
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    },
  },
  ...(authSecret ? { secret: authSecret } : {}),
  baseURL,
  trustedOrigins: [...trustedOrigins],
});
