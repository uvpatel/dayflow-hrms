import { z } from "zod";
import { pgTable, serial, text, timestamp, integer, index } from "drizzle-orm/pg-core";

export const designations = pgTable(
  "designations",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id"),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("designations_org_id_idx").on(table.organizationId),
  ]
);

export const designationSchema = z.object({
  id: z.number().int().optional(),
  organizationId: z.number().int().optional().nullable(),
  name: z.string(),
  description: z.string().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Designation = typeof designations.$inferSelect;
export type NewDesignation = typeof designations.$inferInsert;
