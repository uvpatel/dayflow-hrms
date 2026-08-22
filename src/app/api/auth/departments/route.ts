import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { departments } from "@/db/schema";
import { desc, ilike } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const data = await db
      .select()
      .from(departments)
      .where(search ? ilike(departments.name, `%${search}%`) : undefined)
      .orderBy(desc(departments.createdAt));

    return NextResponse.json({
      success: true,
      message: "Departments fetched successfully",
      data,
      meta: { total: data.length, search },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch departments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: "Department name is required" },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(departments)
      .values({
        name: body.name,
        description: body.description ?? null,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "Department created successfully",
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create department" },
      { status: 500 }
    );
  }
}
