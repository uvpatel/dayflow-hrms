import { z } from "zod";

export const punchActionSchema = z.object({
  userId: z.string().optional(),
});

export const manualAttendanceSchema = z.object({
  userId: z.string().min(1, "userId is required"),
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
});

export const updateAttendanceSchema = z.object({
  userId: z.string().optional(),
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
});

export const createCorrectionSchema = z.object({
  userId: z.string().optional(),
  correctionDate: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
  reason: z.string().min(3, "Reason must be at least 3 characters"),
});

export const updateCorrectionSchema = z.object({
  correctionDate: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
  reason: z.string().min(3).optional(),
});
