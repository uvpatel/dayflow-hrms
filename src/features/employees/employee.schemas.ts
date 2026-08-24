import { z } from "zod";

export const createAddressSchema = z.object({
  addressLine1: z.string().min(2, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().min(2, "Postal code is required"),
  country: z.string().min(2, "Country is required"),
});

export const createEmergencyContactSchema = z.object({
  name: z.string().min(2, "Contact name is required"),
  relationship: z.string().min(2, "Relationship is required"),
  phoneNumber: z.string().min(5, "Valid phone number is required"),
});

export const createDocumentSchema = z.object({
  documentType: z.string().min(2, "Document type is required"),
  documentUrl: z.string().url("Valid document URL is required"),
});

export const createEmployeeSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Valid email address is required").transform((value) => value.trim().toLowerCase()),
  phoneNumber: z.string().min(5, "Valid phone number is required").optional(),
  employeeNumber: z
    .string()
    .trim()
    .min(1)
    .transform((value) => value.toUpperCase())
    .optional(),
  departmentId: z.number().int().positive().optional().nullable(),
  designationId: z.number().int().positive().optional().nullable(),
  managerId: z.number().int().positive().optional().nullable(),
  locationId: z.number().int().positive().optional().nullable(),
  workScheduleId: z.number().int().positive().optional().nullable(),
  role: z.enum(["admin", "hr", "manager", "employee"]).default("employee"),
  employmentStatus: z.enum(["active", "onboarding", "notice_period", "inactive"]).default("onboarding"),
  employmentType: z.enum(["full_time", "part_time", "contract", "intern"]).default("full_time"),
  joiningDate: z.string().or(z.date()).transform((value) => new Date(value)).optional().nullable(),
  address: createAddressSchema.optional(),
  emergencyContact: createEmergencyContactSchema.optional(),
  document: createDocumentSchema.optional(),
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  email: z.string().email().transform((value) => value.trim().toLowerCase()).optional(),
  phoneNumber: z.string().min(5).nullable().optional(),
  departmentId: z.number().int().positive().nullable().optional(),
  designationId: z.number().int().positive().nullable().optional(),
  managerId: z.number().int().positive().nullable().optional(),
  locationId: z.number().int().positive().nullable().optional(),
  workScheduleId: z.number().int().positive().nullable().optional(),
  role: z.enum(["admin", "hr", "manager", "employee"]).optional(),
  employmentStatus: z.enum(["active", "onboarding", "notice_period", "inactive"]).optional(),
  employmentType: z.enum(["full_time", "part_time", "contract", "intern"]).optional(),
  joiningDate: z.string().or(z.date()).transform((value) => new Date(value)).nullable().optional(),
}).strict();

/** Fields an employee may change without HR intervention. */
export const updateSelfEmployeeSchema = z.object({
  phoneNumber: z.string().trim().min(5).nullable(),
}).strict();

export const employeeQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  departmentId: z.coerce.number().int().positive().optional(),
  status: z.enum(["active", "onboarding", "notice_period", "inactive"]).optional(),
});

export const assignManagerSchema = z.object({
  managerId: z.number().int().positive().nullable(),
});
