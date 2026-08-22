// export src/db/schema/time-off/leave-policies.ts;


import { z } from "zod";
import { index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

import { organizations } from "./organizations";

export const leavePolicies = pgTable(
  "leave_policies",
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
  (table) => [index("leave_policies_org_id_idx").on(table.organizationId)],
);

export const leavePolicySchema = z.object({
  id: z.number().int().optional(),
  organizationId: z.number().int(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
