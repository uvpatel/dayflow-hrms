import "server-only";

import { z } from "zod";
import {
  isSecureProductionAuthOrigin,
  normalizeAuthOrigin,
  resolveCanonicalAuthUrl,
} from "@/lib/auth/url";

const explicitAuthUrl = process.env.BETTER_AUTH_URL?.trim();
const normalizedAuthUrl = normalizeAuthOrigin(explicitAuthUrl);
if (!explicitAuthUrl || !normalizedAuthUrl) {
  throw new Error(
    "AUTH_CONFIGURATION_ERROR: BETTER_AUTH_URL is required and must be a valid HTTP(S) application origin.",
  );
}

try {
  const parsedAuthUrl = new URL(explicitAuthUrl);
  if (
    parsedAuthUrl.origin !== normalizedAuthUrl ||
    (parsedAuthUrl.pathname !== "/" && parsedAuthUrl.pathname !== "") ||
    parsedAuthUrl.search ||
    parsedAuthUrl.hash
  ) {
    throw new Error("BETTER_AUTH_URL must contain only an origin");
  }
} catch {
  throw new Error(
    "AUTH_CONFIGURATION_ERROR: BETTER_AUTH_URL must include http:// or https:// and contain only the application origin.",
  );
}

const resolvedAuthUrl = resolveCanonicalAuthUrl();

const serverEnvSchema = z.object({
  BETTER_AUTH_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
});

const parsed = serverEnvSchema.safeParse({
  BETTER_AUTH_URL: resolvedAuthUrl,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET?.trim(),
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID?.trim(),
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET?.trim(),
});

if (!parsed.success) {
  throw new Error(
    `AUTH_CONFIGURATION_ERROR: Invalid server environment (${parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ")}).`,
  );
}

if (process.env.NODE_ENV === "production") {
  if (!isSecureProductionAuthOrigin(parsed.data.BETTER_AUTH_URL)) {
    throw new Error(
      "AUTH_CONFIGURATION_ERROR: The production auth URL must use HTTPS and cannot be a loopback address.",
    );
  }
}

export const serverEnv = parsed.data;
