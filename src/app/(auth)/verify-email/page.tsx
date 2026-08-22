import Link from "next/link";
import { MailCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MailCheck className="size-8" />
            </div>
            <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
            <CardDescription className="text-balance text-muted-foreground pt-1">
              We&apos;ve sent a verification link to your email address. Please click the link in the message to activate your Dayflow account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="rounded-lg border border-border bg-muted/40 p-4 text-center text-xs text-muted-foreground">
              Didn&apos;t receive an email? Check your spam folder or contact your HR administrator for an invitation link.
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href="/sign-in">
                  <ArrowLeft className="mr-2 size-4" />
                  Return to Sign In
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
