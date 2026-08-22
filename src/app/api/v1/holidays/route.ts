import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth-context";
import { db } from "@/db";
import { holidays } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { error, ctx } = await requireAuth(request.headers);
  if (error || !ctx) return error!;

  try {
    const whereClause = ctx.organizationId ? eq(holidays.organizationId, ctx.organizationId) : undefined;
    const data = await db.select().from(holidays).where(whereClause).orderBy(desc(holidays.holidayDate));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error("Error fetching holidays:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch holidays" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error, ctx } = await requirePermission("organization:manage", request.headers);
  if (error || !ctx) return error!;

  try {
    const body = await request.json();
    if (!body.name || !body.holidayDate) {
      return NextResponse.json({ success: false, error: "Holiday name and date are required" }, { status: 400 });
    }

    const [created] = await db
      .insert(holidays)
      .values({
        name: body.name.trim(),
        description: body.description?.trim() || null,
        holidayDate: new Date(body.holidayDate),
        organizationId: ctx.organizationId,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "Holiday created successfully",
      data: created,
    }, { status: 201 });
  } catch (err) {
    console.error("Error creating holiday:", err);
    return NextResponse.json({ success: false, error: "Failed to create holiday" }, { status: 500 });
  }
}
