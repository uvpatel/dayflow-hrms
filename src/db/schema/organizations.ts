import { z } from "zod";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug"),
  description: text("description"),
  timezone: text("timezone").default("UTC").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const organizationSchema = z.object({
  id: z.number().int().optional(),
  name: z.string(),
  slug: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  timezone: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
