import { NextRequest } from "next/server";
import { db } from "@/db";
import { payslips } from "@/db/schema";
import { desc } from "drizzle-orm";
import { errorResponse, successResponse } from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "self:read");

    const records = await db
      .select()
      .from(payslips)
      .orderBy(desc(payslips.createdAt))
      .limit(50);

    return successResponse(records, undefined, "Self payslips fetched successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
