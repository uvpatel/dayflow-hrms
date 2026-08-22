import { z } from "zod";

export const punchActionSchema = z.object({
  userId: z.string().optional(),
}).strict();

export const manualAttendanceSchema = z.object({
  employeeId: z.number().int().positive().optional(),
  userId: z.string().min(1, "Employee identity is required").optional(),
  date: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
  checkInTime: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
  checkOutTime: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
  status: z.enum(["present", "absent", "half_day", "leave", "holiday"]).default("present"),
}).refine((data) => data.employeeId !== undefined || data.userId !== undefined, {
  message: "employeeId or userId is required",
});

export const updateAttendanceSchema = z.object({
  date: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
  checkInTime: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
  checkOutTime: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
  status: z.enum(["present", "absent", "half_day", "leave", "holiday"]).optional(),
}).strict();

export const createCorrectionSchema = z.object({
  attendanceId: z.number().int().positive().optional(),
  correctionDate: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
  reason: z.string().min(3, "Reason must be at least 3 characters"),
  requestedCheckInTime: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
  requestedCheckOutTime: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
}).strict();

export const updateCorrectionSchema = z.object({
  correctionDate: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
  reason: z.string().min(3).optional(),
}).strict();
