import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payslips } from "@/db/schema";
import { desc, eq, ilike } from "drizzle-orm";

type RouteParams = {
  params: Promise<{ employeeId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { employeeId } = await params;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const data = await db
      .select()
      .from(payslips)
      .where(search ? ilike(payslips.name, `%${search}%`) : undefined)
      .orderBy(desc(payslips.createdAt));

    return NextResponse.json({
      success: true,
      message: `Payslips for employee ${employeeId} fetched successfully`,
      data,
      meta: { employeeId, count: data.length },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch employee payslips" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { employeeId } = await params;
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: "Payslip name is required" },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(payslips)
      .values({
        name: body.name,
        description: body.description ?? `Employee ID: ${employeeId}`,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: `Payslip generated for employee ${employeeId}`,
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to generate employee payslip" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { employeeId } = await params;
    const body = await request.json();
    const id = Number(body.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Valid payslip ID is required" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(payslips)
      .set({
        name: body.name,
        description: body.description ?? null,
        updatedAt: new Date(),
      })
      .where(eq(payslips.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      message: `Payslip ${id} for employee ${employeeId} replaced successfully`,
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to replace payslip" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { employeeId } = await params;
    const body = await request.json();
    const id = Number(body.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Valid payslip ID is required" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(payslips)
      .set({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        updatedAt: new Date(),
      })
      .where(eq(payslips.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      message: `Payslip ${id} for employee ${employeeId} updated successfully`,
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update payslip" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { employeeId } = await params;
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Valid payslip ID is required in query params" },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(payslips)
      .where(eq(payslips.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      message: `Payslip ${id} for employee ${employeeId} deleted successfully`,
      data: deleted,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete payslip" },
      { status: 500 }
    );
  }
}
