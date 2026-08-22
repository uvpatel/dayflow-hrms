"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight, RefreshCw, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyTeam } from "@/hooks/use-employees";
import { useMe } from "@/hooks/use-me";

export default function MyTeamPage() {
  const meQuery = useMe();
  const role = (meQuery.data?.user.role ?? meQuery.data?.employee?.role ?? "employee").toLowerCase();
  const canViewTeam = role === "manager" || role === "hr" || role === "admin";
  const teamQuery = useMyTeam({ enabled: canViewTeam });

  if (meQuery.isLoading) {
    return <div className="mx-auto grid w-full max-w-6xl gap-4 p-4 md:p-8"><Skeleton className="h-24" /><Skeleton className="h-64" /></div>;
  }

  if (!canViewTeam) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 md:p-8">
        <Card className="border-destructive/30">
          <CardContent className="flex gap-3 p-6">
            <AlertCircle className="size-5 shrink-0 text-destructive" />
            <div><h1 className="font-semibold">My Team is not available for this role</h1><p className="mt-1 text-sm text-muted-foreground">Your personal employee tools remain available from the dashboard.</p></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6 lg:p-8">
      <div>
        <Badge variant="outline" className="mb-3 uppercase tracking-wider">Manager workspace</Badge>
        <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight"><Users className="size-7 text-primary" />My team</h1>
        <p className="mt-2 text-sm text-muted-foreground">Direct reports assigned through the organization’s manager hierarchy.</p>
      </div>

      <Card>
        <CardHeader className="sm:flex-row sm:items-center sm:justify-between">
          <div><CardTitle>Direct reports</CardTitle><CardDescription>{teamQuery.data?.total ?? 0} assigned employee{teamQuery.data?.total === 1 ? "" : "s"}</CardDescription></div>
          <Button variant="outline" size="sm" onClick={() => void teamQuery.refetch()} disabled={teamQuery.isFetching}><RefreshCw className={`size-4 ${teamQuery.isFetching ? "animate-spin" : ""}`} />Refresh</Button>
        </CardHeader>
        <CardContent>
          {teamQuery.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-28" />)}</div>
          ) : teamQuery.isError ? (
            <button type="button" onClick={() => void teamQuery.refetch()} className="w-full rounded-lg border border-destructive/30 p-6 text-left text-sm text-destructive">Team assignments could not be loaded: {teamQuery.error.message}. Select to retry.</button>
          ) : (teamQuery.data?.items.length ?? 0) === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">No direct reports are assigned to you.</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {teamQuery.data?.items.map((employee) => (
                <Link key={employee.id} href={`/dashboard/my-team/${employee.id}`} className="group rounded-xl border p-4 transition-colors hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-medium">{employee.firstName} {employee.lastName}</p><p className="truncate text-xs text-muted-foreground">{employee.email}</p></div><ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" /></div>
                  <div className="mt-4 flex gap-2"><Badge variant="secondary" className="capitalize">{employee.employmentStatus.replaceAll("_", " ")}</Badge>{employee.employeeNumber ? <Badge variant="outline">{employee.employeeNumber}</Badge> : null}</div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
