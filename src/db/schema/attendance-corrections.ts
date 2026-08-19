import { z } from "zod";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const attendanceCorrections = pgTable("attendance_corrections", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  correctionDate: timestamp("correction_date").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const attendanceCorrectionSchema = z.object({
  id: z.number().int().optional(),
  userId: z.string(),
  correctionDate: z.date(),
  reason: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});