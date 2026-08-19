// export src/db/schema/time-off/leave-allocations.ts;

import { z } from "zod";
import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const leaveAllocations = pgTable("leave_allocations", {
    id: serial("id").primaryKey(),
    employeeId: integer("employee_id").notNull(),
    leaveType: text("leave_type").notNull(),
    allocatedDays: integer("allocated_days").notNull(),
    usedDays: integer("used_days").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const leaveAllocationSchema = z.object({
    id: z.number().int().optional(),
    employeeId: z.number().int(),
    leaveType: z.string(),
    allocatedDays: z.number().int(),
    usedDays: z.number().int().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});
