import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { departments } from "@/db/schema";
import { eq } from "drizzle-orm";

type RouteParams = {
  params: Promise<{ departmentId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { departmentId } = await params;
    const id = Number(departmentId);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid department ID" },
        { status: 400 }
      );
    }

    const [department] = await db
      .select()
      .from(departments)
      .where(eq(departments.id, id));

    if (!department) {
      return NextResponse.json(
        { success: false, error: "Department not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Department ${id} fetched successfully`,
      data: department,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch department" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { departmentId } = await params;
    const id = Number(departmentId);
    const body = await request.json();

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid department ID" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(departments)
      .set({
        name: body.name,
        description: body.description ?? null,
        updatedAt: new Date(),
      })
      .where(eq(departments.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Department not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Department ${id} replaced successfully`,
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to replace department" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { departmentId } = await params;
    const id = Number(departmentId);
    const body = await request.json();

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid department ID" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(departments)
      .set({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        updatedAt: new Date(),
      })
      .where(eq(departments.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Department not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Department ${id} updated successfully`,
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update department" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { departmentId } = await params;
    const id = Number(departmentId);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid department ID" },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(departments)
      .where(eq(departments.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Department not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Department ${id} deleted successfully`,
      data: deleted,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete department" },
      { status: 500 }
    );
  }
}
