// export src/db/schema/time-off/leave-types.ts;

import { z } from "zod";
import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const leaveTypes = pgTable(
  "leave_types",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").references(
      () => organizations.id,
      { onDelete: "cascade" },
    ),
    name: text("name").notNull(),
    description: text("description"),
    requiresBalance: boolean("requires_balance").default(true).notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("leave_types_organization_id_idx").on(table.organizationId),
    uniqueIndex("leave_types_organization_name_uidx").on(
      table.organizationId,
      table.name,
    ),
  ],
);

export type LeaveType = typeof leaveTypes.$inferSelect;

export const leaveTypeSchema = z.object({
  id: z.number().int().optional(),
  organizationId: z.number().int().optional().nullable(),
  name: z.string(),
  description: z.string().optional(),
  requiresBalance: z.boolean().optional(),
  active: z.boolean().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
