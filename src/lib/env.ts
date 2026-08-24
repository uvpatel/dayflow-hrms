import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  BETTER_AUTH_URL: z.url().transform((value) => new URL(value).origin),
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
});

const parsed = serverEnvSchema.safeParse({
  BETTER_AUTH_URL:
    process.env.BETTER_AUTH_URL ??
    (process.env.NODE_ENV === "production" ? undefined : "http://localhost:3000"),
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
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
