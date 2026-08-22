import { NextRequest } from "next/server";
import { db } from "@/db";
import { activityLogs } from "@/db/schema";
import { count, desc, ilike, or } from "drizzle-orm";
import {
  errorResponse,
  paginatedResponse,
  parsePagination,
  buildPaginationMeta,
} from "@/lib/api";
import { getAuthContext, requirePermission } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "audit:read");

    const { searchParams } = new URL(request.url);
    const { page, limit, offset, search } = parsePagination(searchParams, 50, 100);

    const where = search
      ? or(
          ilike(activityLogs.action, `%${search}%`),
          ilike(activityLogs.description, `%${search}%`)
        )
      : undefined;

    const [items, [totalRes]] = await Promise.all([
      db
        .select()
        .from(activityLogs)
        .where(where)
        .orderBy(desc(activityLogs.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(activityLogs).where(where),
    ]);

    const total = totalRes?.total ?? 0;
    const meta = buildPaginationMeta(page, limit, total, { search });

    return paginatedResponse(items, meta, "Activity logs fetched successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
