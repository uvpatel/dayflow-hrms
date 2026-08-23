"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getProtectedAuthContext } from "@/lib/auth-context";
import { isRole } from "@/lib/permissions";
import { updateLinkedUserRole } from "@/lib/auth/roles";

export async function setRole(formData: FormData) {
  const ctx = await getProtectedAuthContext(await headers());

  if (ctx.role !== "admin" || ctx.organizationId == null) {
    throw new Error("Unauthorized: Admin permission required");
  }

  const id = formData.get("id");
  const role = formData.get("role");

  if (typeof id !== "string" || !id || !isRole(role)) {
    throw new Error("A valid user ID and Dayflow role are required");
  }

  const updated = await updateLinkedUserRole(id, ctx.organizationId, role);
  if (!updated) {
    throw new Error(
      "The selected user is not linked to an employee in your organization",
    );
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard/organization/roles");
}

export async function removeRole(formData: FormData) {
  const ctx = await getProtectedAuthContext(await headers());

  if (ctx.role !== "admin" || ctx.organizationId == null) {
    throw new Error("Unauthorized: Admin permission required");
  }

  const id = formData.get("id");

  if (typeof id !== "string" || !id) {
    throw new Error("Missing id");
  }

  const updated = await updateLinkedUserRole(
    id,
    ctx.organizationId,
    "employee",
  );
  if (!updated) {
    throw new Error(
      "The selected user is not linked to an employee in your organization",
    );
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard/organization/roles");
}
