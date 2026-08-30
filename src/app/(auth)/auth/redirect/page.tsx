import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requirePageAuthContext } from "@/lib/auth/page";
import { getRoleLandingPath } from "@/lib/auth/landing";

/** Handles both credential and OAuth post-authentication redirects. */
export default async function AuthRedirectPage() {
  const context = await requirePageAuthContext(await headers());

  redirect(getRoleLandingPath(context.accessRole));
}
