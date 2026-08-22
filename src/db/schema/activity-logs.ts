// export src/db/schema/workflow/activity-logs.ts;


import { z } from "zod";
import { index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").references(() => organizations.id, {
      onDelete: "restrict",
    }),
    action: text("action").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("activity_logs_org_id_idx").on(table.organizationId)],
);

export type ActivityLog = typeof activityLogs.$inferSelect;

export const activityLogSchema = z.object({
  id: z.number().int().optional(),
  organizationId: z.number().int().optional().nullable(),
  action: z.string(),
  description: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
