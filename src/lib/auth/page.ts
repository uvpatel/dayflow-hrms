import { redirect } from "next/navigation";

import {
  getAuthContext,
  type ProtectedAuthContext,
} from "@/lib/auth-context";
import { getAuthAccessIssue } from "@/lib/auth/access";
import { sanitizeCallbackPath } from "@/lib/auth/redirects";

/**
 * Page-level companion to the API authorization boundary. It keeps expired
 * sessions on the sign-in flow and sends authenticated but ineligible users to
 * a non-looping access explanation page.
 */
export async function requirePageAuthContext(
  requestHeaders: Headers,
): Promise<ProtectedAuthContext> {
  const context = await getAuthContext(requestHeaders);
  const issue = getAuthAccessIssue(context);

  if (issue === "AUTH_REQUIRED") {
    const requestedPath = requestHeaders.get("x-dayflow-pathname");
    if (requestedPath) {
      const callbackURL = sanitizeCallbackPath(requestedPath);
      redirect(`/sign-in?callbackURL=${encodeURIComponent(callbackURL)}`);
    }
    redirect("/sign-in");
  }

  if (issue) {
    redirect(`/auth/access-denied?reason=${issue.toLowerCase()}`);
  }

  return context as ProtectedAuthContext;
}
