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
}).strict().refine(
  (data) => data.requestedCheckInTime !== undefined || data.requestedCheckOutTime !== undefined,
  {
    message: "At least one corrected check-in or check-out time is required",
    path: ["requestedCheckInTime"],
  },
);

export const updateCorrectionSchema = z.object({
  correctionDate: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
  reason: z.string().min(3).optional(),
}).strict();

export const decideCorrectionSchema = z
  .object({
    decision: z.enum(["approved", "rejected"]),
    comment: z.string().trim().max(500).optional(),
  })
  .strict()
  .superRefine((data, context) => {
    if (data.decision === "rejected" && !data.comment) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A comment is required when rejecting a correction",
        path: ["comment"],
      });
    }
  });
