// export src/db/schema/employees/employee-documents.ts;

import { z } from "zod";
import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const employeeDocuments = pgTable("employee_documents", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  documentType: text("document_type").notNull(),
  documentUrl: text("document_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const employeeDocumentSchema = z.object({
  id: z.number().int().optional(),
  employeeId: z.number().int(),
  documentType: z.string(),
  documentUrl: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
