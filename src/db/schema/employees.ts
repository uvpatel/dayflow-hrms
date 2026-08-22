import { z } from "zod";
import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  check,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { departments } from "./departments";
import { designations } from "./designations";
import { locations } from "./locations";
import { organizations } from "./organizations";

export const employees = pgTable(
  "employees",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .unique()
      .references(() => user.id, { onDelete: "set null" }),
    organizationId: integer("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    employeeNumber: text("employee_number"),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    phoneNumber: text("phone_number"),
    departmentId: integer("department_id").references(() => departments.id, {
      onDelete: "set null",
    }),
    designationId: integer("designation_id").references(() => designations.id, {
      onDelete: "set null",
    }),
    managerId: integer("manager_id").references(
      (): AnyPgColumn => employees.id,
      { onDelete: "set null" },
    ),
    locationId: integer("location_id").references(() => locations.id, {
      onDelete: "set null",
    }),
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
    index("employees_manager_id_idx").on(table.managerId),
    index("employees_org_manager_id_idx").on(table.organizationId, table.managerId),
    index("employees_department_id_idx").on(table.departmentId),
    index("employees_designation_id_idx").on(table.designationId),
    index("employees_location_id_idx").on(table.locationId),
    index("employees_work_schedule_id_idx").on(table.workScheduleId),
    uniqueIndex("employees_email_uidx").on(table.email),
    uniqueIndex("employees_employee_number_uidx")
      .on(table.employeeNumber)
      .where(sql`${table.employeeNumber} is not null`),
    check(
      "employees_manager_not_self_check",
      sql`${table.managerId} is null or ${table.managerId} <> ${table.id}`,
    ),
    check(
      "employees_role_check",
      sql`${table.role} in ('admin', 'hr', 'manager', 'employee')`,
    ),
    check(
      "employees_status_check",
      sql`${table.employmentStatus} in ('active', 'onboarding', 'notice_period', 'inactive')`,
    ),
    check(
      "employees_type_check",
      sql`${table.employmentType} is null or ${table.employmentType} in ('full_time', 'part_time', 'contract', 'intern')`,
    ),
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
