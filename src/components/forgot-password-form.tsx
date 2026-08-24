"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2Icon, MailCheckIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordForm({ initialEmail = "" }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string>();
  const [isPending, setIsPending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    setError(undefined);
    setIsPending(true);
    try {
      const { error: requestError } = await authClient.requestPasswordReset({
        email: normalizedEmail,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (requestError) {
        setError(requestError.message || "Unable to request a password reset.");
        return;
      }
      setIsSent(true);
    } catch {
      setError("Unable to request a password reset. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary"><MailCheckIcon className="size-7" /></div>
        <CardTitle className="text-2xl">Reset your password</CardTitle>
        <CardDescription>Enter your work email and we&apos;ll send a secure reset link.</CardDescription>
      </CardHeader>
      <CardContent>
        {isSent ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">If an account exists for that address, a reset link has been sent. Check your inbox and spam folder.</p>
            <Link href="/sign-in" className={cn(buttonVariants(), "w-full")}>Return to sign in</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <FieldGroup>
              {error ? <div role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}
              <Field>
                <FieldLabel htmlFor="email">Work email</FieldLabel>
                <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(undefined); }} disabled={isPending} aria-invalid={Boolean(error)} required />
                {error ? <FieldError errors={[{ message: error }]} /> : null}
              </Field>
              <Button type="submit" disabled={isPending} className="w-full">{isPending ? <><Loader2Icon className="size-4 animate-spin" />Sending reset link...</> : "Send reset link"}</Button>
              <Link href="/sign-in" className={cn(buttonVariants({ variant: "ghost" }), "w-full")}>Back to sign in</Link>
            </FieldGroup>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
