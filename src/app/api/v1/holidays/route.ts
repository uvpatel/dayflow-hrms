import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { holidays } from "@/db/schema";
import { desc, eq, ilike } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const data = await db
      .select()
      .from(holidays)
      .where(search ? ilike(holidays.name, `%${search}%`) : undefined)
      .orderBy(desc(holidays.holidayDate));

    return NextResponse.json({
      success: true,
      message: "Holidays fetched successfully",
      data,
      meta: { count: data.length },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch holidays" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.holidayDate) {
      return NextResponse.json(
        { success: false, error: "Holiday name and holidayDate are required" },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(holidays)
      .values({
        name: body.name,
        description: body.description ?? null,
        holidayDate: new Date(body.holidayDate),
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "Holiday created successfully",
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create holiday" },
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
        { success: false, error: "Valid holiday ID is required" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(holidays)
      .set({
        name: body.name,
        description: body.description ?? null,
        holidayDate: body.holidayDate ? new Date(body.holidayDate) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(holidays.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Holiday not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Holiday ${id} replaced successfully`,
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to replace holiday" },
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
        { success: false, error: "Valid holiday ID is required" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(holidays)
      .set({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.holidayDate !== undefined && { holidayDate: new Date(body.holidayDate) }),
        updatedAt: new Date(),
      })
      .where(eq(holidays.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Holiday not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Holiday ${id} updated successfully`,
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update holiday" },
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
        { success: false, error: "Valid holiday ID is required in query params" },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(holidays)
      .where(eq(holidays.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Holiday not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Holiday ${id} deleted successfully`,
      data: deleted,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete holiday" },
      { status: 500 }
    );
  }
}
