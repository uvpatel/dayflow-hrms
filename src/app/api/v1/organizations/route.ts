import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requirePermission } from "@/lib/auth-context";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { error, ctx } = await requireAuth(request.headers);
  if (error || !ctx) return error!;

  try {
    const whereClause = ctx.organizationId ? eq(organizations.id, ctx.organizationId) : undefined;
    const data = await db.select().from(organizations).where(whereClause);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error("Error fetching organization:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch organization" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { error, ctx } = await requirePermission("organization:manage", request.headers);
  if (error || !ctx) return error!;

  if (!ctx.organizationId) {
    return NextResponse.json({ success: false, error: "Organization not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const updateData: { name?: string; description?: string | null; updatedAt: Date } = {
      updatedAt: new Date(),
    };

    if (body.name && typeof body.name === "string" && body.name.trim()) {
      updateData.name = body.name.trim();
    }
    if (body.description !== undefined) {
      updateData.description = typeof body.description === "string" ? body.description : null;
    }

    const [updated] = await db
      .update(organizations)
      .set(updateData)
      .where(eq(organizations.id, ctx.organizationId))
      .returning();

    return NextResponse.json({
      success: true,
      message: "Organization updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("Error updating organization:", err);
    return NextResponse.json({ success: false, error: "Failed to update organization" }, { status: 500 });
  }
}
