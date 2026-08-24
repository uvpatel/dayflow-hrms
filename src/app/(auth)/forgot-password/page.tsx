import { ForgotPasswordForm } from "@/components/forgot-password-form";

type ForgotPasswordPageProps = { searchParams: Promise<{ email?: string | string[] }> };

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = await searchParams;
  const email = Array.isArray(params.email) ? params.email[0] : params.email;
  return <main className="flex min-h-svh items-center justify-center bg-muted p-6 md:p-10"><ForgotPasswordForm initialEmail={email ?? ""} /></main>;
}
