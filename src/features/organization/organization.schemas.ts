import { z } from "zod";

// Organization
export const createOrganizationSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  description: z.string().optional(),
});

export const updateOrganizationSchema = createOrganizationSchema.partial();

// Department
export const createDepartmentSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters"),
  description: z.string().optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

// Designation
export const createDesignationSchema = z.object({
  name: z.string().min(2, "Designation name must be at least 2 characters"),
  description: z.string().optional(),
});

export const updateDesignationSchema = createDesignationSchema.partial();

// Location
export const createLocationSchema = z.object({
  name: z.string().min(2, "Location name must be at least 2 characters"),
  description: z.string().optional(),
});

export const updateLocationSchema = createLocationSchema.partial();

// Holiday
export const createHolidaySchema = z.object({
  name: z.string().min(2, "Holiday name must be at least 2 characters"),
  description: z.string().optional(),
  holidayDate: z.string().or(z.date()).transform((val) => new Date(val)),
});

export const updateHolidaySchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  holidayDate: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
});

// Work Schedule
export const createWorkScheduleSchema = z.object({
  employeeId: z.number().int().positive("Valid employee ID is required"),
  scheduleName: z.string().min(2, "Schedule name must be at least 2 characters"),
  startDate: z.string().or(z.date()).transform((val) => new Date(val)),
  endDate: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
});

export const updateWorkScheduleSchema = z.object({
  scheduleName: z.string().min(2).optional(),
  startDate: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
  endDate: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
});
