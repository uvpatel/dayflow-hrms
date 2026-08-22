import { db } from "@/db";
import { activityLogs } from "@/db/schema";

export interface LogActivityParams {
  action: string;
  description?: string;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await db.insert(activityLogs).values({
      action: params.action,
      description: params.description ?? null,
    });
  } catch (err) {
    console.error("Failed to write activity log:", err);
  }
}
