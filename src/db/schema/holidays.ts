import { z } from "zod";
import { pgTable, serial, text, timestamp, integer, index } from "drizzle-orm/pg-core";

export const holidays = pgTable(
  "holidays",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id"),
    name: text("name").notNull(),
    description: text("description"),
    holidayDate: timestamp("holiday_date").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("holidays_org_id_idx").on(table.organizationId),
    index("holidays_date_idx").on(table.holidayDate),
  ]
);

export const holidaySchema = z.object({
  id: z.number().int().optional(),
  organizationId: z.number().int().optional().nullable(),
  name: z.string(),
  description: z.string().optional().nullable(),
  holidayDate: z.date(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Holiday = typeof holidays.$inferSelect;
export type NewHoliday = typeof holidays.$inferInsert;
