"use client";

import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function ResendVerificationButton({ email }: { email?: string }) {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string>();

  async function resend() {
    if (!email) {
      setMessage("Return to sign in and enter your email address first.");
      return;
    }
    setIsPending(true);
    setMessage(undefined);
    try {
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: `${window.location.origin}/auth/redirect`,
      });
      setMessage(error ? (error.message || "Unable to resend the email.") : "A new verification link has been sent.");
    } catch {
      setMessage("Unable to resend the email. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return <div className="space-y-2 text-center"><Button type="button" variant="outline" className="w-full" onClick={resend} disabled={isPending}>{isPending ? <><Loader2Icon className="size-4 animate-spin" />Sending...</> : "Resend verification email"}</Button>{message ? <p role="status" className="text-xs text-muted-foreground">{message}</p> : null}</div>;
}
