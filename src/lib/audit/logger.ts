import { db } from "@/db";
import { activityLogs } from "@/db/schema";

export interface LogActivityParams {
  organizationId: number;
  action: string;
  description?: string;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await db.insert(activityLogs).values({
      organizationId: params.organizationId,
      action: params.action,
      description: params.description ?? null,
    });
  } catch (err) {
    console.error("Failed to write activity log:", err);
  }
}
