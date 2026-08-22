"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema/auth-schema";
import { eq } from "drizzle-orm";

export async function setRole(formData: FormData): Promise<void> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const callerRole = (session?.user as { role?: string })?.role;
  if (!session || callerRole !== "admin") {
    const existingAdmins = await db
      .select()
      .from(user)
      .where(eq(user.role, "admin"))
      .limit(1);

    if (existingAdmins.length > 0 && callerRole !== "admin") {
      console.error("Unauthorized: Only admins can change user roles");
      return;
    }
  }

  const id = formData.get("id") as string;
  const role = (formData.get("role") as string) || "user";

  if (!id) return;

  try {
    await db
      .update(user)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(eq(user.id, id));

    revalidatePath("/admin");
  } catch (err) {
    console.error("Failed to update user role:", err);
  }
}

export async function removeRole(formData: FormData): Promise<void> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const callerRole = (session?.user as { role?: string })?.role;
  if (!session || callerRole !== "admin") {
    console.error("Unauthorized: Only admins can remove roles");
    return;
  }

  const id = formData.get("id") as string;
  if (!id) return;

  try {
    await db
      .update(user)
      .set({
        role: "user",
        updatedAt: new Date(),
      })
      .where(eq(user.id, id));

    revalidatePath("/admin");
  } catch (err) {
    console.error("Failed to remove role:", err);
  }
}
