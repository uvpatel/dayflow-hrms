import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { desc, ilike, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.max(1, Number(searchParams.get("limit") ?? 10));
    const offset = (page - 1) * limit;

    const whereClause = search
      ? or(
          ilike(employees.firstName, `%${search}%`),
          ilike(employees.lastName, `%${search}%`),
          ilike(employees.email, `%${search}%`),
          ilike(employees.phoneNumber, `%${search}%`)
        )
      : undefined;

    const data = await db
      .select()
      .from(employees)
      .where(whereClause)
      .orderBy(desc(employees.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      message: "Employees fetched successfully",
      data,
      meta: { page, limit, count: data.length, search },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.firstName || !body.lastName || !body.email || !body.phoneNumber) {
      return NextResponse.json(
        { success: false, error: "First name, last name, email, and phone number are required" },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(employees)
      .values({
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phoneNumber: body.phoneNumber,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "Employee created successfully",
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create employee" },
      { status: 500 }
    );
  }
}
