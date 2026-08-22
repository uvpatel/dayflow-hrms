import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { eq } from "drizzle-orm";

type RouteParams = {
  params: Promise<{ employeeId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { employeeId } = await params;
    const id = Number(employeeId);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid employee ID" },
        { status: 400 }
      );
    }

    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, id));

    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Employee ${id} fetched successfully`,
      data: employee,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch employee" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { employeeId } = await params;
    const id = Number(employeeId);
    const body = await request.json();

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid employee ID" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(employees)
      .set({
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phoneNumber: body.phoneNumber,
        updatedAt: new Date(),
      })
      .where(eq(employees.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Employee ${id} replaced successfully`,
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to replace employee" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { employeeId } = await params;
    const id = Number(employeeId);
    const body = await request.json();

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid employee ID" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(employees)
      .set({
        ...(body.firstName !== undefined && { firstName: body.firstName }),
        ...(body.lastName !== undefined && { lastName: body.lastName }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.phoneNumber !== undefined && { phoneNumber: body.phoneNumber }),
        updatedAt: new Date(),
      })
      .where(eq(employees.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Employee ${id} updated successfully`,
      data: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update employee" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { employeeId } = await params;
    const id = Number(employeeId);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid employee ID" },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(employees)
      .where(eq(employees.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Employee ${id} deleted successfully`,
      data: deleted,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete employee" },
      { status: 500 }
    );
  }
}
