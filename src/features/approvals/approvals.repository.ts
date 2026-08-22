import { db } from "@/db";
import { approvalRequests } from "@/db/schema";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { NewApprovalRequest } from "./approvals.types";

export class ApprovalsRepository {
  private whereForScope(scope: {
    requestorIds: number[];
    approverId?: number;
    status?: string;
  }) {
    const conditions = [];
    conditions.push(inArray(approvalRequests.requestorId, scope.requestorIds));
    if (scope.approverId) conditions.push(eq(approvalRequests.approverId, scope.approverId));
    if (scope.status) conditions.push(eq(approvalRequests.status, scope.status));
    return and(...conditions);
  }

  async findApprovals(
    limit: number,
    offset: number,
    scope: { requestorIds: number[]; approverId?: number; status?: string },
  ) {
    if (scope.requestorIds.length === 0) return [];

    const where = this.whereForScope(scope);

    return await db
      .select()
      .from(approvalRequests)
      .where(where)
      .orderBy(desc(approvalRequests.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async countApprovals(scope: {
    requestorIds: number[];
    approverId?: number;
    status?: string;
  }): Promise<number> {
    if (scope.requestorIds.length === 0) return 0;
    const where = this.whereForScope(scope);
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

  async decideApproval(id: number, status: "approved" | "rejected") {
    const [updated] = await db
      .update(approvalRequests)
      .set({ status, updatedAt: new Date() })
      .where(and(
        eq(approvalRequests.id, id),
        eq(approvalRequests.status, "pending"),
      ))
      .returning();
    return updated ?? null;
  }

  async deleteApproval(id: number) {
    const [deleted] = await db.delete(approvalRequests).where(eq(approvalRequests.id, id)).returning();
    return deleted ?? null;
  }
}

export const approvalsRepository = new ApprovalsRepository();
