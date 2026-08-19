// export src/db/schema/employees/emergency-contacts.ts;

import { z } from "zod";
import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const emergencyContacts = pgTable("emergency_contacts", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  name: text("name").notNull(),
  relationship: text("relationship").notNull(),
  phoneNumber: text("phone_number").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const emergencyContactSchema = z.object({
  id: z.number().int().optional(),
  employeeId: z.number().int(),
  name: z.string(),
  relationship: z.string(),
  phoneNumber: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
