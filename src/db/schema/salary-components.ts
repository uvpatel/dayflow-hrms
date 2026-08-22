// export src/db/schema/payroll/salary-components.ts;

import { z } from "zod";
import { index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

import { organizations } from "./organizations";

export const salaryComponents = pgTable(
  "salary_components",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("salary_components_org_id_idx").on(table.organizationId)],
);

export const salaryComponentSchema = z.object({
  id: z.number().int().optional(),
  organizationId: z.number().int(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
