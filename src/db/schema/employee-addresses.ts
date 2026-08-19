// export src/db/schema/employees/employee-addresses.ts;


import { z } from "zod";
import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const employeeAddresses = pgTable("employee_addresses", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  addressLine1: text("address_line_1").notNull(),
  addressLine2: text("address_line_2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const employeeAddressSchema = z.object({
  id: z.number().int().optional(),
  employeeId: z.number().int(),
  addressLine1: z.string(),
  addressLine2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  country: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
