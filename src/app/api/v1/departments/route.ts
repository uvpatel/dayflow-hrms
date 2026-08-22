import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth-context";
import { db } from "@/db";
import { departments } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { error, ctx } = await requireAuth(request.headers);
  if (error || !ctx) return error!;

  try {
    const whereClause = ctx.organizationId ? eq(departments.organizationId, ctx.organizationId) : undefined;
    const data = await db.select().from(departments).where(whereClause);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error("Error fetching departments:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch departments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error, ctx } = await requirePermission("organization:manage", request.headers);
  if (error || !ctx) return error!;

  try {
    const body = await request.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ success: false, error: "Department name is required" }, { status: 400 });
    }

    const [created] = await db
      .insert(departments)
      .values({
        name: body.name.trim(),
        description: body.description?.trim() || null,
        organizationId: ctx.organizationId,
        managerId: body.managerId ? Number(body.managerId) : null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "Department created successfully",
      data: created,
    }, { status: 201 });
  } catch (err) {
    console.error("Error creating department:", err);
    return NextResponse.json({ success: false, error: "Failed to create department" }, { status: 500 });
  }
}
