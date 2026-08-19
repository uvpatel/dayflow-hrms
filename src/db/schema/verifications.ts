// export src/db/schema/auth/verifications.ts;

import { z } from "zod";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const verifications = pgTable("verifications", {
  id: serial("id").primaryKey(),
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verificationSchema = z.object({
  id: z.number().int().optional(),
  identifier: z.string(),
  token: z.string(),
  expires: z.date(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
