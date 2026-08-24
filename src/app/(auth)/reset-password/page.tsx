import { ResetPasswordForm } from "@/components/reset-password-form";

type ResetPasswordPageProps = { searchParams: Promise<{ token?: string | string[]; error?: string | string[] }> };

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  return <main className="flex min-h-svh items-center justify-center bg-muted p-6 md:p-10"><ResetPasswordForm token={token} invalidToken={Boolean(error)} /></main>;
}
