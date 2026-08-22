import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { approvalRequests } from "@/db/schema";

export type ApprovalRequest = InferSelectModel<typeof approvalRequests>;
export type NewApprovalRequest = InferInsertModel<typeof approvalRequests>;
