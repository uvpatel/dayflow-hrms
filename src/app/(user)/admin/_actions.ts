"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getProtectedAuthContext } from "@/lib/auth-context";
import { isAccessRole, toWorkforceRole } from "@/lib/permissions";
import { updateLinkedUserRole } from "@/lib/auth/roles";

export async function setRole(formData: FormData) {
  const ctx = await getProtectedAuthContext(await headers());

  if (ctx.role !== "admin" || ctx.organizationId == null) {
    throw new Error("Unauthorized: Admin permission required");
  }

  const id = formData.get("id");
  const role = formData.get("role");

  if (typeof id !== "string" || !id || !isAccessRole(role)) {
    throw new Error("A valid user ID and Dayflow role are required");
  }

  const updated = await updateLinkedUserRole(
    id,
    ctx.organizationId,
    toWorkforceRole(role),
  );
  if (!updated) {
    throw new Error(
      "The selected user is not linked to an employee in your organization",
    );
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard/roles");
}

export async function setManagerCapability(formData: FormData) {
  const ctx = await getProtectedAuthContext(await headers());

  if (ctx.role !== "admin" || ctx.organizationId == null) {
    throw new Error("Unauthorized: Admin permission required");
  }

  const id = formData.get("id");
  const enabled = formData.get("enabled");

  if (
    typeof id !== "string" ||
    !id ||
    (enabled !== "true" && enabled !== "false")
  ) {
    throw new Error("A valid user ID and manager capability are required");
  }

  const updated = await updateLinkedUserRole(
    id,
    ctx.organizationId,
    enabled === "true" ? "manager" : "employee",
  );
  if (!updated) {
    throw new Error(
      "The selected user is not linked to an employee in your organization",
    );
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard/roles");
}
