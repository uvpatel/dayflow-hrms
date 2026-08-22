import { db } from "@/db";
import { notifications } from "@/db/schema";

export interface SendNotificationParams {
  userId: number;
  message: string;
}

export async function sendNotification(params: SendNotificationParams): Promise<void> {
  try {
    await db.insert(notifications).values({
      userId: params.userId,
      message: params.message,
      read: 0,
    });
  } catch (err) {
    console.error("Failed to send notification:", err);
  }
}
