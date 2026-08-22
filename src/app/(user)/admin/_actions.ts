"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getAuthContext } from "@/lib/auth-context";
import { db } from "@/db";
import { user, employees } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isRole } from "@/lib/permissions";

export async function setRole(formData: FormData) {
  const ctx = await getAuthContext(await headers());

  if (!ctx || ctx.role !== "admin") {
    throw new Error("Unauthorized: Admin permission required");
  }

  const id = formData.get("id");
  const role = formData.get("role");

  if (typeof id !== "string" || !id || !isRole(role)) {
    throw new Error("A valid user ID and Dayflow role are required");
  }

  // Update auth user table
  await db
    .update(user)
    .set({
      role,
      updatedAt: new Date(),
    })
    .where(eq(user.id, id));

  // Sync with employee record if linked
  await db
    .update(employees)
    .set({
      role,
      updatedAt: new Date(),
    })
    .where(eq(employees.userId, id));

  revalidatePath("/admin");
}

export async function removeRole(formData: FormData) {
  const ctx = await getAuthContext(await headers());

  if (!ctx || ctx.role !== "admin") {
    throw new Error("Unauthorized: Admin permission required");
  }

  const id = formData.get("id");

  if (typeof id !== "string" || !id) {
    throw new Error("Missing id");
  }

  await db
    .update(user)
    .set({
      role: "employee",
      updatedAt: new Date(),
    })
    .where(eq(user.id, id));

  await db
    .update(employees)
    .set({
      role: "employee",
      updatedAt: new Date(),
    })
    .where(eq(employees.userId, id));

  revalidatePath("/admin");
}
