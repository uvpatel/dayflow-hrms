"use client";

import { useState } from "react";
import Link from "next/link";
import { EyeIcon, EyeOffIcon, Loader2Icon, LockKeyholeIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function ResetPasswordForm({ token, invalidToken }: { token?: string; invalidToken?: boolean }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, setIsPending] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || invalidToken) return setError("This reset link is invalid or has expired.");
    if (password.length < 12) return setError("Password must be at least 12 characters long.");
    if (password !== confirmation) return setError("Passwords do not match.");
    setError(undefined);
    setIsPending(true);
    try {
      const { error: resetError } = await authClient.resetPassword({ newPassword: password, token });
      if (resetError) {
        setError(resetError.message || "This reset link is invalid or has expired.");
        return;
      }
      setIsComplete(true);
    } catch {
      setError("Unable to reset your password. Please request a new link.");
    } finally {
      setIsPending(false);
    }
  }

  const tokenIsInvalid = invalidToken || !token;
  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary"><LockKeyholeIcon className="size-7" /></div>
        <CardTitle className="text-2xl">Choose a new password</CardTitle>
        <CardDescription>Your new password must contain at least 12 characters.</CardDescription>
      </CardHeader>
      <CardContent>
        {isComplete ? (
          <div className="space-y-4 text-center"><p className="text-sm text-muted-foreground">Your password has been updated and all previous sessions have been signed out.</p><Link href="/sign-in" className={cn(buttonVariants(), "w-full")}>Sign in with new password</Link></div>
        ) : tokenIsInvalid ? (
          <div className="space-y-4 text-center"><div role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">This reset link is invalid or has expired.</div><Link href="/forgot-password" className={cn(buttonVariants(), "w-full")}>Request a new reset link</Link></div>
        ) : (
          <form onSubmit={handleSubmit} noValidate><FieldGroup>
            {error ? <div role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}
            <Field><FieldLabel htmlFor="new-password">New password</FieldLabel><div className="relative"><Input id="new-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => { setPassword(event.target.value); setError(undefined); }} disabled={isPending} className="pr-10" required /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}</button></div></Field>
            <Field><FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel><Input id="confirm-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmation} onChange={(event) => { setConfirmation(event.target.value); setError(undefined); }} disabled={isPending} required />{error ? <FieldError errors={[{ message: error }]} /> : null}</Field>
            <Button type="submit" disabled={isPending} className="w-full">{isPending ? <><Loader2Icon className="size-4 animate-spin" />Updating password...</> : "Update password"}</Button>
          </FieldGroup></form>
        )}
      </CardContent>
    </Card>
  );
}
