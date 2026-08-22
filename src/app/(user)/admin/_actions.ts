"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema/auth-schema";
import { eq } from "drizzle-orm";

export async function setRole(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const id = formData.get("id") as string;
  const role = formData.get("role") as string;

  if (!id || !role) {
    throw new Error("Missing id or role");
  }

  await db
    .update(user)
    .set({
      role,
      updatedAt: new Date(),
    })
    .where(eq(user.id, id));

  revalidatePath("/admin");
}

export async function removeRole(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const id = formData.get("id") as string;

  if (!id) {
    throw new Error("Missing id");
  }

  await db
    .update(user)
    .set({
      role: "user",
      updatedAt: new Date(),
    })
    .where(eq(user.id, id));

  revalidatePath("/admin");
}
