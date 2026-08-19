// export src/db/schema/organization/holidays.ts;


import { z } from "zod";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const holidays = pgTable("holidays", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  holidayDate: timestamp("holiday_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const holidaySchema = z.object({
  id: z.number().int().optional(),
  name: z.string(),
  description: z.string().optional(),
  holidayDate: z.date(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
