"use client";

import Link from "next/link";
import { AlertCircle, Building2, CreditCard, RefreshCw, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEmployees } from "@/hooks/use-employees";
import { useOrganization } from "@/hooks/use-organization";

export default function BillingPage() {
  const organizationQuery = useOrganization();
  const activeEmployeesQuery = useEmployees({ limit: 1, status: "active" });
  const isRefreshing =
    organizationQuery.isFetching || activeEmployeesQuery.isFetching;

  const refresh = () => {
    void Promise.all([organizationQuery.refetch(), activeEmployeesQuery.refetch()]);
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
      <section className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="outline" className="mb-3 gap-1.5 uppercase tracking-wider">
            <CreditCard className="size-3.5" />
            Workspace administration
          </Badge>
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <CreditCard className="size-7 text-primary" />
            Billing & subscription
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Workspace context is loaded from Dayflow. Subscription changes and
            invoices require a configured billing provider.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isRefreshing}
          className="gap-1.5"
        >
          <RefreshCw className={isRefreshing ? "size-4 animate-spin" : "size-4"} />
          Refresh
        </Button>
      </section>

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <div className="flex items-start gap-3">
            <span className="rounded-lg bg-amber-500/10 p-2 text-amber-700 dark:text-amber-400">
              <AlertCircle className="size-5" />
            </span>
            <div>
              <CardTitle>Billing integration is not configured</CardTitle>
              <CardDescription className="mt-1">
                Dayflow does not currently have a connected subscription or
                payment API. Plan changes, payment methods, and invoice
                downloads are intentionally unavailable instead of simulating a
                successful action.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" render={<Link href="/dashboard/settings" />}>
            Open workspace settings
          </Button>
          <Button variant="outline" render={<Link href="/dashboard/people" />}>
            Open employee directory
          </Button>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div>
              <CardDescription>Active workspace</CardDescription>
              {organizationQuery.isLoading ? (
                <Skeleton className="mt-2 h-7 w-44" />
              ) : organizationQuery.isError || !organizationQuery.data ? (
                <p className="mt-2 text-sm text-destructive">
                  Workspace details are unavailable.
                </p>
              ) : (
                <CardTitle className="mt-2 text-xl">
                  {organizationQuery.data.name}
                </CardTitle>
              )}
            </div>
            <Building2 className="size-5 text-primary" />
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {organizationQuery.data?.timezone
              ? `Timezone: ${organizationQuery.data.timezone}`
              : "Organization data is loaded through the workspace API."}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div>
              <CardDescription>Active employee profiles</CardDescription>
              {activeEmployeesQuery.isLoading ? (
                <Skeleton className="mt-2 h-7 w-16" />
              ) : activeEmployeesQuery.isError ? (
                <p className="mt-2 text-sm text-destructive">
                  Employee count is unavailable.
                </p>
              ) : (
                <CardTitle className="mt-2 text-xl">
                  {activeEmployeesQuery.data?.total ?? 0}
                </CardTitle>
              )}
            </div>
            <Users className="size-5 text-primary" />
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            This live count can be used when a billing provider is connected.
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
