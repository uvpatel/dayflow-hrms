import "server-only";

import { z } from "zod";
import { resolveCanonicalAuthUrl } from "@/lib/auth/url";

const serverEnvSchema = z.object({
  BETTER_AUTH_URL: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
});

const resolvedAuthUrl = resolveCanonicalAuthUrl();

const parsed = serverEnvSchema.safeParse({
  BETTER_AUTH_URL: resolvedAuthUrl,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET?.trim(),
});

if (!parsed.success) {
  throw new Error(
    `Invalid server environment: ${parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ")}`,
  );
}

if (process.env.NODE_ENV === "production" && !parsed.data.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is required in production.");
}

export const serverEnv = parsed.data;
