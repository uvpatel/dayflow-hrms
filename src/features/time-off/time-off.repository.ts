import { db } from "@/db";
import {
  leaveTypes,
  leavePolicies,
  leaveAllocations,
  leaveRequests,
  approvalRequests,
} from "@/db/schema";
import { and, count, desc, eq, lte, gte, or } from "drizzle-orm";
import {
  NewLeaveType,
  NewLeavePolicy,
  NewLeaveAllocation,
  NewLeaveRequest,
} from "./time-off.types";

export class TimeOffRepository {
  // Leave Types
  async findLeaveTypes(limit = 50, offset = 0) {
    return await db
      .select()
      .from(leaveTypes)
      .orderBy(desc(leaveTypes.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findLeaveTypeById(id: number) {
    const [item] = await db.select().from(leaveTypes).where(eq(leaveTypes.id, id));
    return item ?? null;
  }

  async createLeaveType(data: NewLeaveType) {
    const [created] = await db.insert(leaveTypes).values(data).returning();
    return created;
  }

  async updateLeaveType(id: number, data: Partial<NewLeaveType>) {
    const [updated] = await db
      .update(leaveTypes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(leaveTypes.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteLeaveType(id: number) {
    const [deleted] = await db.delete(leaveTypes).where(eq(leaveTypes.id, id)).returning();
    return deleted ?? null;
  }

  // Leave Policies
  async findLeavePolicies(limit = 50, offset = 0) {
    return await db
      .select()
      .from(leavePolicies)
      .orderBy(desc(leavePolicies.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findLeavePolicyById(id: number) {
    const [item] = await db.select().from(leavePolicies).where(eq(leavePolicies.id, id));
    return item ?? null;
  }

  async createLeavePolicy(data: NewLeavePolicy) {
    const [created] = await db.insert(leavePolicies).values(data).returning();
    return created;
  }

  async updateLeavePolicy(id: number, data: Partial<NewLeavePolicy>) {
    const [updated] = await db
      .update(leavePolicies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(leavePolicies.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteLeavePolicy(id: number) {
    const [deleted] = await db.delete(leavePolicies).where(eq(leavePolicies.id, id)).returning();
    return deleted ?? null;
  }

  // Allocations
  async findAllocations(limit = 50, offset = 0, employeeId?: number) {
    const where = employeeId ? eq(leaveAllocations.employeeId, employeeId) : undefined;
    return await db
      .select()
      .from(leaveAllocations)
      .where(where)
      .orderBy(desc(leaveAllocations.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findAllocationById(id: number) {
    const [item] = await db.select().from(leaveAllocations).where(eq(leaveAllocations.id, id));
    return item ?? null;
  }

  async findAllocationByEmployeeAndType(employeeId: number, leaveType: string) {
    const [item] = await db
      .select()
      .from(leaveAllocations)
      .where(and(eq(leaveAllocations.employeeId, employeeId), eq(leaveAllocations.leaveType, leaveType)))
      .limit(1);
    return item ?? null;
  }

  async createAllocation(data: NewLeaveAllocation) {
    const [created] = await db.insert(leaveAllocations).values(data).returning();
    return created;
  }

  async updateAllocation(id: number, data: Partial<NewLeaveAllocation>) {
    const [updated] = await db
      .update(leaveAllocations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(leaveAllocations.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteAllocation(id: number) {
    const [deleted] = await db.delete(leaveAllocations).where(eq(leaveAllocations.id, id)).returning();
    return deleted ?? null;
  }

  // Requests
  async findRequests(limit = 20, offset = 0, employeeId?: number, status?: string) {
    const conditions = [];
    if (employeeId) conditions.push(eq(leaveRequests.employeeId, employeeId));
    if (status) conditions.push(eq(leaveRequests.status, status));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    return await db
      .select()
      .from(leaveRequests)
      .where(where)
      .orderBy(desc(leaveRequests.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async countRequests(employeeId?: number, status?: string): Promise<number> {
    const conditions = [];
    if (employeeId) conditions.push(eq(leaveRequests.employeeId, employeeId));
    if (status) conditions.push(eq(leaveRequests.status, status));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const [res] = await db.select({ total: count() }).from(leaveRequests).where(where);
    return res?.total ?? 0;
  }

  async findRequestById(id: number) {
    const [item] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
    return item ?? null;
  }

  async findOverlappingRequests(employeeId: number, startDate: Date, endDate: Date, excludeId?: number) {
    const conditions = [
      eq(leaveRequests.employeeId, employeeId),
      or(eq(leaveRequests.status, "pending"), eq(leaveRequests.status, "approved")),
      lte(leaveRequests.startDate, endDate),
      gte(leaveRequests.endDate, startDate),
    ];

    const results = await db.select().from(leaveRequests).where(and(...conditions));
    if (excludeId) {
      return results.filter((r) => r.id !== excludeId);
    }
    return results;
  }

  async createRequest(data: NewLeaveRequest) {
    const [created] = await db.insert(leaveRequests).values(data).returning();
    return created;
  }

  async updateRequest(id: number, data: Partial<NewLeaveRequest>) {
    const [updated] = await db
      .update(leaveRequests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(leaveRequests.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteRequest(id: number) {
    const [deleted] = await db.delete(leaveRequests).where(eq(leaveRequests.id, id)).returning();
    return deleted ?? null;
  }

  async createApprovalRequest(requestorId: number, approverId: number, status = "pending") {
    const [created] = await db
      .insert(approvalRequests)
      .values({
        requestorId,
        approverId,
        status,
      })
      .returning();
    return created;
  }
}

export const timeOffRepository = new TimeOffRepository();
