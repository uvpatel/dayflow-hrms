import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { sanitizeCallbackPath } from "@/lib/auth/redirects";

type SignInPageProps = {
  searchParams: Promise<{
    callbackURL?: string | string[];
    error?: string | string[];
    error_description?: string | string[];
  }>;
};

function formatAuthError(error?: string): string | undefined {
  if (!error) return undefined;

  switch (error.toLowerCase()) {
    case "email_not_found":
    case "email_required":
      return "A verified GitHub email address is required. Make a verified email available to GitHub or contact HR.";
    case "email_not_verified":
      return "Your GitHub email address is not verified. Please verify your email on GitHub or contact HR.";
    case "no_matching_employee":
    case "employee_id_mismatch":
      return "No pre-registered employee profile was found matching this account. Please contact your HR administrator.";
    case "employee_id_required":
      return "A valid pre-issued employee ID is required.";
    case "account_not_linked":
      return "An account with this email already exists. Please sign in with your email and password first.";
    case "access_denied":
    case "user_denied":
      return "GitHub sign-in was cancelled.";
    case "state_not_found":
    case "invalid_code":
    case "invalid_callback_request":
      return "The authentication session expired or was invalid. Please try signing in again.";
    case "oauth":
      return "GitHub sign-in could not be completed. Please try again or use email and password.";
    default:
      return "Authentication could not be completed. Please try again.";
  }
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const requestedCallback = Array.isArray(params.callbackURL)
    ? params.callbackURL[0]
    : params.callbackURL;
  const callbackURL = sanitizeCallbackPath(requestedCallback);
  const authError = Array.isArray(params.error) ? params.error[0] : params.error;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect(callbackURL);
  }

  const initialError = formatAuthError(authError);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm
          initialError={initialError}
          githubEnabled={Boolean(
            process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
          )}
        />
      </div>
    </div>
  );
}
