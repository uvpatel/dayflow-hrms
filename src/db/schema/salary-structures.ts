// export src/db/schema/payroll/salary-structures.ts;


import { z } from "zod";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const salaryStructures = pgTable("salary_structures", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SalaryStructure = typeof salaryStructures.$inferSelect;

export const salaryStructureSchema = z.object({
  id: z.number().int().optional(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
