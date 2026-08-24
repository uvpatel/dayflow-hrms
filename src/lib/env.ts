import "server-only";

import { z } from "zod";
import {
  isSecureProductionAuthOrigin,
  normalizeAuthOrigin,
  resolveCanonicalAuthUrl,
} from "@/lib/auth/url";

const explicitAuthUrl = process.env.BETTER_AUTH_URL?.trim();
if (explicitAuthUrl && !normalizeAuthOrigin(explicitAuthUrl)) {
  throw new Error(
    "AUTH_CONFIGURATION_ERROR: BETTER_AUTH_URL must be a valid HTTP(S) application URL.",
  );
}

const resolvedAuthUrl = resolveCanonicalAuthUrl();

const serverEnvSchema = z.object({
  BETTER_AUTH_URL: z.url().optional(),
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
});

const parsed = serverEnvSchema.safeParse({
  BETTER_AUTH_URL: resolvedAuthUrl,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET?.trim(),
});

if (!parsed.success) {
  throw new Error(
    `AUTH_CONFIGURATION_ERROR: Invalid server environment (${parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ")}).`,
  );
}

if (process.env.NODE_ENV === "production") {
  if (!parsed.data.BETTER_AUTH_URL) {
    throw new Error(
      "AUTH_CONFIGURATION_ERROR: A canonical auth URL is required in production. Set BETTER_AUTH_URL or provide a Vercel system URL.",
    );
  }

  if (
    process.env.VERCEL === "1" &&
    !isSecureProductionAuthOrigin(parsed.data.BETTER_AUTH_URL)
  ) {
    throw new Error(
      "AUTH_CONFIGURATION_ERROR: The production auth URL must use HTTPS and cannot be a loopback address.",
    );
  }

  if (!parsed.data.BETTER_AUTH_SECRET) {
    throw new Error(
      "AUTH_CONFIGURATION_ERROR: BETTER_AUTH_SECRET is required in production and must contain at least 32 high-entropy characters.",
    );
  }
}

export const serverEnv = parsed.data;
