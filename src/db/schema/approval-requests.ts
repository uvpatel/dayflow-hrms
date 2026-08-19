// export src/db/schema/workflow/approval-requests.ts;

import { z } from "zod";
import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const approvalRequests = pgTable("approval_requests", {
  id: serial("id").primaryKey(),
  requestorId: integer("requestor_id").notNull(),
  approverId: integer("approver_id").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const approvalRequestSchema = z.object({
  id: z.number().int().optional(),
  requestorId: z.number().int(),
  approverId: z.number().int(),
  status: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
