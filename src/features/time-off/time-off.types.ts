import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import {
  leaveTypes,
  leavePolicies,
  leaveAllocations,
  leaveRequests,
} from "@/db/schema";

export type LeaveType = InferSelectModel<typeof leaveTypes>;
export type NewLeaveType = InferInsertModel<typeof leaveTypes>;

export type LeavePolicy = InferSelectModel<typeof leavePolicies>;
export type NewLeavePolicy = InferInsertModel<typeof leavePolicies>;

export type LeaveAllocation = InferSelectModel<typeof leaveAllocations>;
export type NewLeaveAllocation = InferInsertModel<typeof leaveAllocations>;

export type LeaveRequest = InferSelectModel<typeof leaveRequests>;
export type NewLeaveRequest = InferInsertModel<typeof leaveRequests>;
