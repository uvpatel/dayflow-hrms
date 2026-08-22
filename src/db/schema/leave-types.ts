// export src/db/schema/time-off/leave-types.ts;

import { z } from "zod";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const leaveTypes = pgTable("leave_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type LeaveType = typeof leaveTypes.$inferSelect;

export const leaveTypeSchema = z.object({
  id: z.number().int().optional(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
