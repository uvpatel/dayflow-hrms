// export src/db/schema/attendance/work-schedules.ts;

import { z } from "zod";
import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const workSchedules = pgTable("work_schedules", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  scheduleName: text("schedule_name").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workScheduleSchema = z.object({
  id: z.number().int().optional(),
  employeeId: z.number().int(),
  scheduleName: z.string(),
  startDate: z.date(),
})
