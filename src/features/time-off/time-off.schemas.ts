import { z } from "zod";

// Leave Types
export const createLeaveTypeSchema = z.object({
  name: z.string().min(2, "Leave type name must be at least 2 characters"),
  description: z.string().optional(),
  requiresBalance: z.boolean().default(true),
  active: z.boolean().default(true),
}).strict();

export const updateLeaveTypeSchema = createLeaveTypeSchema.partial();

// Leave Policies
export const createLeavePolicySchema = z.object({
  name: z.string().min(2, "Policy name must be at least 2 characters"),
  description: z.string().optional(),
}).strict();

export const updateLeavePolicySchema = createLeavePolicySchema.partial();

// Leave Allocations
export const createLeaveAllocationSchema = z.object({
  employeeId: z.number().int().positive("Valid employee ID is required"),
  leaveType: z.string().min(1, "Leave type is required"),
  allocatedDays: z.number().positive("Allocated days must be greater than 0").multipleOf(0.5),
  usedDays: z.number().min(0).multipleOf(0.5).default(0),
}).strict();

export const updateLeaveAllocationSchema = z.object({
  allocatedDays: z.number().positive().multipleOf(0.5).optional(),
  usedDays: z.number().min(0).multipleOf(0.5).optional(),
}).strict();

// Leave Requests
export const createLeaveRequestSchema = z.object({
  employeeId: z.number().int().positive().optional(),
  leaveType: z.string().min(1, "Leave type is required"),
  startDate: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
  endDate: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val)),
  reason: z.string().optional(),
  unit: z.enum(["full_day", "half_day"]).default("full_day"),
});

export const updateLeaveRequestSchema = z.object({
  leaveType: z.string().min(1).optional(),
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
  reason: z.string().optional(),
  unit: z.enum(["full_day", "half_day"]).optional(),
});

export const approveLeaveRequestSchema = z.object({
  comment: z.string().trim().optional(),
});

export const rejectLeaveRequestSchema = z.object({
  reason: z.string().trim().min(1, "A rejection comment is required"),
});

export const decideLeaveRequestSchema = z
  .object({
    decision: z.enum(["approved", "rejected"]),
    comment: z.string().trim().optional(),
  })
  .superRefine((data, context) => {
    if (data.decision === "rejected" && !data.comment) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["comment"],
        message: "A rejection comment is required",
      });
    }
  });
