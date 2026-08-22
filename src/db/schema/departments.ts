import { z } from "zod";
import { pgTable, serial, text, timestamp, integer, index } from "drizzle-orm/pg-core";

export const departments = pgTable(
  "departments",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id"),
    name: text("name").notNull(),
    description: text("description"),
    managerId: integer("manager_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("departments_org_id_idx").on(table.organizationId),
  ]
);

export const departmentSchema = z.object({
  id: z.number().int().optional(),
  organizationId: z.number().int().optional().nullable(),
  name: z.string(),
  description: z.string().optional().nullable(),
  managerId: z.number().int().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;
