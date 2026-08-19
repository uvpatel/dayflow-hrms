// export src/db/schema/payroll/payslip-items.ts;

import { z } from "zod";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const payslipItems = pgTable("payslip_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const payslipItemSchema = z.object({
  id: z.number().int().optional(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
