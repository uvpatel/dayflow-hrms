import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins/admin";
import { db } from "@/db";
import * as schema from "@/db/schema/auth-schema";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email/service";

const isProduction = process.env.NODE_ENV === "production";
const authSecret = process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET;
const configuredBaseURL =
  process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL;

if (isProduction && !authSecret) {
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
      await sendPasswordResetEmail(user.email, url, user.name);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url, user.name);
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
          },
        }
      : {}),
  },
  account: {
    encryptOAuthTokens: true,
    storeStateStrategy: "database",
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
