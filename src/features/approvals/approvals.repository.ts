import { db } from "@/db";
import { approvalRequests } from "@/db/schema";
import { and, count, desc, eq } from "drizzle-orm";
import { NewApprovalRequest } from "./approvals.types";

export class ApprovalsRepository {
  async findApprovals(limit = 20, offset = 0, approverId?: number, status?: string) {
    const conditions = [];
    if (approverId) conditions.push(eq(approvalRequests.approverId, approverId));
    if (status) conditions.push(eq(approvalRequests.status, status));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    return await db
      .select()
      .from(approvalRequests)
      .where(where)
      .orderBy(desc(approvalRequests.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async countApprovals(approverId?: number, status?: string): Promise<number> {
    const conditions = [];
    if (approverId) conditions.push(eq(approvalRequests.approverId, approverId));
    if (status) conditions.push(eq(approvalRequests.status, status));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const [res] = await db.select({ total: count() }).from(approvalRequests).where(where);
    return res?.total ?? 0;
  }

  async findApprovalById(id: number) {
    const [item] = await db.select().from(approvalRequests).where(eq(approvalRequests.id, id));
    return item ?? null;
  }

  async createApproval(data: NewApprovalRequest) {
    const [created] = await db.insert(approvalRequests).values(data).returning();
    return created;
  }

  async updateApproval(id: number, data: Partial<NewApprovalRequest>) {
    const [updated] = await db
      .update(approvalRequests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(approvalRequests.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteApproval(id: number) {
    const [deleted] = await db.delete(approvalRequests).where(eq(approvalRequests.id, id)).returning();
    return deleted ?? null;
  }
}

export const approvalsRepository = new ApprovalsRepository();
