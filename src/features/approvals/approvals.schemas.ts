import { z } from "zod";

export const createApprovalSchema = z.object({
  requestorId: z.number().int().positive("Valid requestor ID is required"),
  approverId: z.number().int().positive("Valid approver ID is required"),
}).strict();

export const updateApprovalSchema = z.object({
  approverId: z.number().int().positive().optional(),
}).strict();

export const approvalActionSchema = z.object({
  reason: z.string().trim().min(3),
}).strict();
