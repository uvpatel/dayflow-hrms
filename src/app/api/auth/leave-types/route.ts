import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leaveTypes } from "@/db/schema";
import { desc, eq, ilike } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const data = await db
      .select()
      .from(leaveTypes)
      .where(search ? ilike(leaveTypes.name, `%${search}%`) : undefined)
      .orderBy(desc(leaveTypes.createdAt));

    return NextResponse.json({
      success: true,
      message: "Leave types fetched successfully",
      data,
      meta: { count: data.length },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch leave types" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: "Leave type name is required" },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(leaveTypes)
      .values({
        name: body.name,
        description: body.description ?? null,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "Leave type created successfully",
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create leave type" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const id = Number(body.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Valid leave type ID is required" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(leaveTypes)
      .set({
        name: body.name,
        description: body.description ?? null,
        updatedAt: new Date(),
      })
      .where(eq(leaveTypes.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Leave type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Leave type ${id} replaced successfully`,
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to replace leave type" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const id = Number(body.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Valid leave type ID is required" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(leaveTypes)
      .set({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        updatedAt: new Date(),
      })
      .where(eq(leaveTypes.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Leave type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Leave type ${id} updated successfully`,
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update leave type" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Valid leave type ID is required in query params" },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(leaveTypes)
      .where(eq(leaveTypes.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Leave type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Leave type ${id} deleted successfully`,
      data: deleted,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete leave type" },
      { status: 500 }
    );
  }
}
