// export src/db/schema/payroll/salary-structures.ts;


import { sql } from "drizzle-orm";
import { z } from "zod";
import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { organizations } from "./organizations";

export const salaryStructures = pgTable(
  "salary_structures",
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
  (table) => [
    index("salary_structures_org_id_idx").on(table.organizationId),
    uniqueIndex("salary_structures_org_name_uidx")
      .on(table.organizationId, table.name)
      .where(sql`${table.organizationId} is not null`),
  ],
);

export type SalaryStructure = typeof salaryStructures.$inferSelect;

export const salaryStructureSchema = z.object({
  id: z.number().int().optional(),
  organizationId: z.number().int(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
