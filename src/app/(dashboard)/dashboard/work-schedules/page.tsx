"use client";

import { AlertCircle, CalendarClock, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/hooks/use-me";
import { useWorkSchedules } from "@/hooks/use-organization";

function formatMinutes(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export default function WorkSchedulesPage() {
  const meQuery = useMe();
  const role = (meQuery.data?.employee?.role ?? meQuery.data?.user.role ?? "employee").toLowerCase();
  const canManage = role === "hr" || role === "admin";
  const schedulesQuery = useWorkSchedules(undefined, { enabled: canManage });

  if (meQuery.isLoading) return <div className="mx-auto w-full max-w-6xl p-4 md:p-8"><Skeleton className="h-72" /></div>;
  if (!canManage) return <div className="mx-auto w-full max-w-3xl p-4 md:p-8"><Card className="border-destructive/30"><CardContent className="flex gap-3 p-6"><AlertCircle className="size-5 text-destructive" /><div><h1 className="font-semibold">Work schedule management is restricted</h1><p className="mt-1 text-sm text-muted-foreground">HR or an administrator can manage organization schedules.</p></div></CardContent></Card></div>;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6 lg:p-8">
      <div><h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight"><CalendarClock className="size-7 text-primary" />Work schedules</h1><p className="mt-2 text-sm text-muted-foreground">Assigned shifts, timezones, breaks, and attendance thresholds.</p></div>
      <Card>
        <CardHeader className="sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>Schedule assignments</CardTitle><CardDescription>Real organization schedule records</CardDescription></div><Button size="sm" variant="outline" onClick={() => void schedulesQuery.refetch()} disabled={schedulesQuery.isFetching}><RefreshCw className={`size-4 ${schedulesQuery.isFetching ? "animate-spin" : ""}`} />Refresh</Button></CardHeader>
        <CardContent>
          {schedulesQuery.isLoading ? <Skeleton className="h-48" /> : schedulesQuery.isError ? <button type="button" onClick={() => void schedulesQuery.refetch()} className="w-full rounded-lg border border-destructive/30 p-5 text-left text-sm text-destructive">Schedules could not be loaded: {schedulesQuery.error.message}. Select to retry.</button> : (schedulesQuery.data?.length ?? 0) === 0 ? <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">No work schedules have been configured.</div> : <div className="grid gap-3 sm:grid-cols-2">{schedulesQuery.data?.map((schedule) => <div key={schedule.id} className="rounded-xl border p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{schedule.scheduleName}</p><p className="text-xs text-muted-foreground">Employee #{schedule.employeeId}</p></div><Badge variant="outline">{schedule.timezone}</Badge></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-muted-foreground">Shift</p><p className="font-medium tabular-nums">{formatMinutes(schedule.shiftStartMinutes)}–{formatMinutes(schedule.shiftEndMinutes)}</p></div><div><p className="text-xs text-muted-foreground">Break</p><p className="font-medium tabular-nums">{schedule.breakMinutes} min</p></div></div></div>)}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
