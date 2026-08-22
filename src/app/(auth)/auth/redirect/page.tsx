import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuthContext } from "@/lib/auth-context";
import { getRoleLandingPath } from "@/lib/auth/landing";

/** Handles both credential and OAuth post-authentication redirects. */
export default async function AuthRedirectPage() {
  const context = await getAuthContext(await headers());

  if (!context) {
    redirect("/sign-in");
  }

  redirect(getRoleLandingPath(context.role));
}
