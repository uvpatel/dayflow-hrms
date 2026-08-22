import { z } from "zod";
import { pgTable, serial, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const employees = pgTable(
  "employees",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").unique(),
    organizationId: integer("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    employeeNumber: text("employee_number"),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    phoneNumber: text("phone_number"),
    departmentId: integer("department_id"),
    designationId: integer("designation_id"),
    managerId: integer("manager_id"),
    locationId: integer("location_id"),
    workScheduleId: integer("work_schedule_id"),
    role: text("role").default("employee").notNull(), // admin | hr | manager | employee
    employmentStatus: text("employment_status").default("active").notNull(), // active | onboarding | notice_period | inactive
    employmentType: text("employment_type").default("full_time"), // full_time | part_time | contract | intern
    joiningDate: timestamp("joining_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("employees_user_id_idx").on(table.userId),
    index("employees_org_id_idx").on(table.organizationId),
    index("employees_email_idx").on(table.email),
  ]
);

export const employeeSchema = z.object({
  id: z.number().int().optional(),
  userId: z.string().optional().nullable(),
  organizationId: z.number().int().optional().nullable(),
  employeeNumber: z.string().optional().nullable(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phoneNumber: z.string().optional().nullable(),
  departmentId: z.number().int().optional().nullable(),
  designationId: z.number().int().optional().nullable(),
  managerId: z.number().int().optional().nullable(),
  locationId: z.number().int().optional().nullable(),
  workScheduleId: z.number().int().optional().nullable(),
  role: z.enum(["admin", "hr", "manager", "employee"]).optional(),
  employmentStatus: z.enum(["active", "onboarding", "notice_period", "inactive"]).optional(),
  employmentType: z.enum(["full_time", "part_time", "contract", "intern"]).optional(),
  joiningDate: z.date().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
