import type { NextRequest } from "next/server";

import { db } from "@/db";
import { organizations } from "@/db/schema";
import { updateOrganizationSchema } from "@/features/organization/organization.schemas";
import {
  errorResponse,
  successResponse,
  validateBody,
} from "@/lib/api";
import {
  getAuthContext,
  requireOrganization,
  requirePermission,
} from "@/lib/auth/session";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "organization:read");
    const organizationId = requireOrganization(authContext);
    const data = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId));

    return successResponse(data);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    requirePermission(authContext, "organization:manage");
    const organizationId = requireOrganization(authContext);
    const data = await validateBody(request, updateOrganizationSchema);

    const [updated] = await db
      .update(organizations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(organizations.id, organizationId))
      .returning();

    return successResponse(
      updated,
      undefined,
      "Organization updated successfully",
    );
  } catch (error) {
    return errorResponse(error);
  }
}
