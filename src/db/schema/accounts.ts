// export src/db/schema/auth/accounts.ts;

import { z } from "zod";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  accessTokenExpires: timestamp("access_token_expires"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accountSchema = z.object({
  id: z.number().int().optional(),
  userId: z.string(),
  provider: z.string(),
  providerAccountId: z.string(),
  refreshToken: z.string().optional(),
  accessToken: z.string().optional(),
  accessTokenExpires: z.date().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})