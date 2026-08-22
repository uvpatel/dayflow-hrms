import { z } from "zod";

export const createApprovalSchema = z.object({
  requestorId: z.number().int().positive("Valid requestor ID is required"),
  approverId: z.number().int().positive("Valid approver ID is required"),
  status: z.string().default("pending"),
});

export const updateApprovalSchema = z.object({
  approverId: z.number().int().positive().optional(),
  status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
});

export const approvalActionSchema = z.object({
  reason: z.string().optional(),
});
