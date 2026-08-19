import { z } from "zod";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const sessions = pgTable("sessions", {
    id: serial("id").primaryKey(),
    sessionToken: text("session_token").notNull().unique(),
    userId: text("user_id").notNull(),
    expires: timestamp("expires").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessionSchema = z.object({
    id: z.number().int().optional(),
    sessionToken: z.string(),
    userId: z.string(),
    expires: z.date(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});