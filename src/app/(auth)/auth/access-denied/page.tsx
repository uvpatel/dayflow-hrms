import { ShieldAlert } from "lucide-react";

import { AuthAccessActions } from "@/components/auth-access-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AccessDeniedPageProps = {
  searchParams: Promise<{ reason?: string | string[] }>;
};

const REASON_COPY = {
  employee_profile_required: {
    title: "Employee profile required",
    description:
      "Your identity is authenticated, but it is not linked to an employee profile. Ask your HR administrator to provision or link your account.",
  },
  account_disabled: {
    title: "Account access disabled",
    description:
      "Your employee profile is inactive or has an unsupported status. Contact your HR administrator if you believe this is a mistake.",
  },
} as const;

export default async function AccessDeniedPage({
  searchParams,
}: AccessDeniedPageProps) {
  const params = await searchParams;
  const requestedReason = Array.isArray(params.reason)
    ? params.reason[0]
    : params.reason;
  const copy =
    requestedReason && requestedReason in REASON_COPY
      ? REASON_COPY[requestedReason as keyof typeof REASON_COPY]
      : {
          title: "Access unavailable",
          description:
            "This signed-in account cannot access Dayflow. Contact your HR administrator for help.",
        };

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="size-6" />
          </div>
          <CardTitle>{copy.title}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthAccessActions />
        </CardContent>
      </Card>
    </main>
  );
}
