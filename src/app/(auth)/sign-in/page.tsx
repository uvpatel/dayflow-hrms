import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { sanitizeCallbackPath } from "@/lib/auth/redirects";

type SignInPageProps = {
  searchParams: Promise<{
    callbackURL?: string | string[];
    error?: string | string[];
  }>;
};

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

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm
          callbackURL={callbackURL}
          initialError={
            authError
              ? "GitHub sign-in could not be completed. Please try again or use email and password."
              : undefined
          }
          githubEnabled={Boolean(
            process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
          )}
        />
      </div>
    </div>
  );
}
