"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  Clock3,
  LogIn,
  LogOut,
  RefreshCw,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCheckIn,
  useCheckOut,
  useTodayAttendance,
} from "@/hooks/use-attendance";
import { useMyTeam } from "@/hooks/use-employees";
import { useMyTimeOff } from "@/hooks/use-leave";
import { useMe } from "@/hooks/use-me";
import { useNotifications } from "@/hooks/use-notifications";
import { useHolidays, useWorkSchedules } from "@/hooks/use-organization";
import { useMyPayslips } from "@/hooks/use-payroll";
import { useDashboardReports } from "@/hooks/use-reports";

type DayflowRole = "admin" | "hr" | "manager" | "employee";
type AttendanceState = "not_checked_in" | "checked_in" | "checked_out";

function normalizeRole(role?: string | null): DayflowRole {
  const value = role?.toLowerCase();
  if (value === "admin" || value === "hr" || value === "manager") {
    return value;
  }
  return "employee";
}

function formatDuration(start?: Date | string | null, end?: Date | string | null) {
  if (!start) return "0h 00m";
  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : Date.now();
  const minutes = Math.max(0, Math.floor((endMs - startMs) / 60_000));
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
}

function formatTime(value?: Date | string | null, timeZone?: string) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      timeZone,
    }).format(new Date(value));
  } catch {
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

function formatShift(startMinutes?: number, endMinutes?: number) {
  if (startMinutes === undefined || endMinutes === undefined) return "Not assigned";
  const format = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return new Date(2000, 0, 1, hours, mins).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  return `${format(startMinutes)}–${format(endMinutes)}`;
}

function getAttendanceState(record: {
  checkInTime?: Date | string | null;
  checkOutTime?: Date | string | null;
} | null | undefined): AttendanceState {
  if (!record?.checkInTime) return "not_checked_in";
  return record.checkOutTime ? "checked_out" : "checked_in";
}

const subscribeToClientClock = () => () => {};
const getServerDateLabel = () => "";

function getClientDateLabel() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function useLiveDuration(
  start?: Date | string | null,
  end?: Date | string | null
) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!start || end) return;
    const timer = window.setInterval(() => setTick((tick) => tick + 1), 1_000);
    return () => window.clearInterval(timer);
  }, [end, start]);

  return formatDuration(start, end);
}

function QueryError({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card className="border-destructive/30">
      <CardContent className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-3.5" />
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}

function MetricLink({
  label,
  value,
  detail,
  href,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  detail: string;
  href: string;
  icon: LucideIcon;
}) {
  return (
    <Link href={href} className="group rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      <Card className="h-full transition-colors group-hover:border-primary/40">
        <CardContent className="flex h-full items-start justify-between gap-4 p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
          </div>
          <span className="rounded-lg bg-primary/10 p-2 text-primary transition-transform group-hover:-translate-y-0.5">
            <Icon className="size-4" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyPanel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const todayLabel = useSyncExternalStore(
    subscribeToClientClock,
    getClientDateLabel,
    getServerDateLabel,
  );
  const meQuery = useMe();
  const employeeId = meQuery.data?.employee?.id;
  const role = normalizeRole(
    meQuery.data?.employee?.role ?? meQuery.data?.user.role
  );
  const canReview = role === "manager" || role === "hr" || role === "admin";

  const attendanceQuery = useTodayAttendance();
  const timeOffQuery = useMyTimeOff();
  const payslipsQuery = useMyPayslips();
  const holidaysQuery = useHolidays();
  const notificationsQuery = useNotifications();
  const schedulesQuery = useWorkSchedules(employeeId, { enabled: Boolean(employeeId) });
  const dashboardQuery = useDashboardReports(role, canReview);
  const teamQuery = useMyTeam({ enabled: role === "manager" });

  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  const attendance = attendanceQuery.data;
  const attendanceState = getAttendanceState(attendance);
  const schedule = schedulesQuery.data?.find(
    (item) => item.employeeId === employeeId
  );
  const elapsed = useLiveDuration(
    attendance?.checkInTime,
    attendance?.checkOutTime
  );

  const upcomingHolidays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (holidaysQuery.data ?? [])
      .filter((holiday) => new Date(holiday.holidayDate).getTime() >= today.getTime())
      .toSorted(
        (a, b) =>
          new Date(a.holidayDate).getTime() - new Date(b.holidayDate).getTime()
      );
  }, [holidaysQuery.data]);

  const requests = timeOffQuery.data?.requests ?? [];
  const allocations = timeOffQuery.data?.allocations ?? [];
  const latestPayslip = payslipsQuery.data?.[0];
  const unreadNotifications = (notificationsQuery.data ?? []).filter(
    (notification) => notification.read === 0
  );
  const firstName =
    meQuery.data?.employee?.firstName ||
    meQuery.data?.user.name?.split(" ")[0] ||
    "there";
  const roleName = role === "hr" ? "HR" : role[0].toUpperCase() + role.slice(1);

  const handleCheckIn = async () => {
    try {
      const result = await checkIn.mutateAsync();
      toast.success(
        result?.checkInTime
          ? `Checked in at ${formatTime(result.checkInTime, schedule?.timezone)}`
          : "Checked in"
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Check-in failed");
    }
  };

  const handleCheckOut = async () => {
    try {
      const result = await checkOut.mutateAsync();
      toast.success(
        result?.checkInTime
          ? `Checked out · ${formatDuration(result.checkInTime, result.checkOutTime)}`
          : "Checked out"
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Check-out failed");
    }
  };

  if (meQuery.isLoading) {
    return (
      <div className="mx-auto grid w-full max-w-7xl gap-5 p-4 md:p-6 lg:p-8">
        <Skeleton className="h-24 rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-xl lg:col-span-2" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (meQuery.isError) {
    return (
      <div className="mx-auto w-full max-w-4xl p-4 md:p-8">
        <QueryError
          title="Your workspace could not be loaded"
          message={meQuery.error.message}
          onRetry={() => void meQuery.refetch()}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6 lg:p-8">
      <section className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="outline" className="mb-3 uppercase tracking-wider">
            {roleName} workspace
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Good day, {firstName}.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Your workday, time off, payroll, and team signals are aligned here.
          </p>
        </div>
        <p className="min-h-5 text-sm tabular-nums text-muted-foreground">
          {todayLabel}
        </p>
      </section>

      {!meQuery.data?.employee ? (
        <QueryError
          title="No employee profile is linked"
          message="Ask HR to link your account before using attendance and employee services."
          onRetry={() => void meQuery.refetch()}
        />
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
        <Card className="overflow-hidden border-primary/25">
          <CardHeader className="border-b bg-primary/5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardDescription className="uppercase tracking-wider">Workday pulse</CardDescription>
              <CardTitle className="mt-2 flex items-center gap-2 text-2xl">
                <span
                  className={`size-2.5 rounded-full ${
                    attendanceState === "checked_in"
                      ? "animate-pulse bg-emerald-500"
                      : attendanceState === "checked_out"
                        ? "bg-primary"
                        : "bg-muted-foreground/40"
                  }`}
                />
                {attendanceState === "checked_in"
                  ? "You’re checked in"
                  : attendanceState === "checked_out"
                    ? "Today’s shift is complete"
                    : "Ready when you are"}
              </CardTitle>
            </div>
            <Badge
              variant="outline"
              className={
                attendance?.status?.toLowerCase() === "late"
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              }
            >
              {attendance?.status
                ? attendance.status.replaceAll("_", " ")
                : "Not started"}
            </Badge>
          </CardHeader>
          <CardContent className="p-5 md:p-6">
            {attendanceQuery.isLoading ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            ) : attendanceQuery.isError ? (
              <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-destructive/30 p-4 sm:flex-row sm:items-center">
                <p className="text-sm text-destructive">
                  Attendance state could not be loaded: {attendanceQuery.error.message}
                </p>
                <Button variant="outline" size="sm" onClick={() => void attendanceQuery.refetch()}>
                  Try again
                </Button>
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border bg-muted/25 p-4">
                    <p className="text-xs text-muted-foreground">Check in</p>
                    <p className="mt-1 text-lg font-medium tabular-nums">
                      {formatTime(attendance?.checkInTime, schedule?.timezone)}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/25 p-4">
                    <p className="text-xs text-muted-foreground">Work duration</p>
                    <p className="mt-1 text-lg font-medium tabular-nums">{elapsed}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/25 p-4">
                    <p className="text-xs text-muted-foreground">Check out</p>
                    <p className="mt-1 text-lg font-medium tabular-nums">
                      {formatTime(attendance?.checkOutTime, schedule?.timezone)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm">
                    <p className="font-medium">{schedule?.scheduleName ?? "Work schedule"}</p>
                    <p className="text-muted-foreground">
                      {formatShift(schedule?.shiftStartMinutes, schedule?.shiftEndMinutes)}
                      {schedule?.timezone ? ` · ${schedule.timezone}` : ""}
                    </p>
                  </div>
                  {attendanceState === "checked_in" ? (
                    <Dialog>
                      <DialogTrigger
                        render={<Button variant="destructive" disabled={checkOut.isPending} />}
                      >
                        {checkOut.isPending ? (
                          <RefreshCw className="size-4 animate-spin" />
                        ) : (
                          <LogOut className="size-4" />
                        )}
                        Check out
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Finish today’s shift?</DialogTitle>
                          <DialogDescription>
                            Dayflow will use the server time and calculate your final work duration.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter showCloseButton>
                          <Button
                            variant="destructive"
                            onClick={() => void handleCheckOut()}
                            disabled={checkOut.isPending}
                          >
                            Finish shift
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  ) : attendanceState === "not_checked_in" ? (
                    <Button
                      onClick={() => void handleCheckIn()}
                      disabled={
                        checkIn.isPending ||
                        !meQuery.data?.employee ||
                        meQuery.data.employee.employmentStatus !== "active"
                      }
                    >
                      {checkIn.isPending ? (
                        <RefreshCw className="size-4 animate-spin" />
                      ) : (
                        <LogIn className="size-4" />
                      )}
                      Check in
                    </Button>
                  ) : (
                    <Button render={<Link href="/dashboard/attendance" />} variant="outline">
                      View attendance
                      <ArrowRight className="size-4" />
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next on your calendar</CardTitle>
            <CardDescription>Upcoming organization holidays</CardDescription>
          </CardHeader>
          <CardContent>
            {holidaysQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : holidaysQuery.isError ? (
              <button
                type="button"
                className="w-full rounded-lg border border-destructive/30 p-4 text-left text-sm text-destructive"
                onClick={() => void holidaysQuery.refetch()}
              >
                Holidays could not be loaded. Select to retry.
              </button>
            ) : upcomingHolidays.length === 0 ? (
              <EmptyPanel>No upcoming holidays are scheduled.</EmptyPanel>
            ) : (
              <div className="space-y-3">
                {upcomingHolidays.slice(0, 3).map((holiday) => (
                  <div key={holiday.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <span className="flex size-11 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <span className="text-[10px] uppercase">
                        {new Date(holiday.holidayDate).toLocaleDateString(undefined, { month: "short" })}
                      </span>
                      <span className="text-base font-semibold leading-none">
                        {new Date(holiday.holidayDate).getDate()}
                      </span>
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{holiday.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {holiday.description || "Organization holiday"}
                      </p>
                    </div>
                  </div>
                ))}
                <Button render={<Link href="/dashboard/holidays" />} variant="ghost" className="w-full">
                  View holiday calendar
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {canReview ? (
        <section aria-labelledby="operations-heading" className="space-y-4">
          <div>
            <h2 id="operations-heading" className="text-lg font-semibold">Operations snapshot</h2>
            <p className="text-sm text-muted-foreground">
              {role === "manager" ? "Signals for your team and pending reviews." : "Organization-wide workforce signals."}
            </p>
          </div>
          {dashboardQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : dashboardQuery.isError ? (
            <QueryError
              title="Operations metrics could not be loaded"
              message={dashboardQuery.error.message}
              onRetry={() => void dashboardQuery.refetch()}
            />
          ) : dashboardQuery.data ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricLink label="Active employees" value={dashboardQuery.data.totalEmployees} detail="Current workforce" href="/dashboard/people" icon={Users} />
              <MetricLink label="Present today" value={dashboardQuery.data.presentToday} detail={`${dashboardQuery.data.absentToday} absent`} href="/dashboard/attendance" icon={Clock3} />
              <MetricLink label="On leave" value={dashboardQuery.data.onLeaveToday} detail="Approved time off today" href="/dashboard/time-off" icon={CalendarDays} />
              <MetricLink label="Pending approvals" value={dashboardQuery.data.pendingApprovals} detail="Requests awaiting action" href="/dashboard/approvals" icon={Check} />
            </div>
          ) : null}

          {role === "manager" ? (
            <Card>
              <CardHeader className="sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Direct reports</CardTitle>
                  <CardDescription>Your assigned team members</CardDescription>
                </div>
                <Button render={<Link href="/dashboard/my-team" />} variant="outline" size="sm">
                  Open my team
                </Button>
              </CardHeader>
              <CardContent>
                {teamQuery.isLoading ? (
                  <Skeleton className="h-24" />
                ) : teamQuery.isError ? (
                  <button
                    type="button"
                    className="w-full rounded-lg border border-destructive/30 p-4 text-left text-sm text-destructive"
                    onClick={() => void teamQuery.refetch()}
                  >
                    Team assignments could not be loaded. Select to retry.
                  </button>
                ) : (teamQuery.data?.items.length ?? 0) === 0 ? (
                  <EmptyPanel>No direct reports are assigned to you.</EmptyPanel>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {teamQuery.data?.items.slice(0, 6).map((employee) => (
                      <Link
                        key={employee.id}
                        href={`/dashboard/my-team/${employee.id}`}
                        className="rounded-lg border p-3 transition-colors hover:border-primary/40 hover:bg-muted/30"
                      >
                        <p className="font-medium">{employee.firstName} {employee.lastName}</p>
                        <p className="truncate text-xs text-muted-foreground">{employee.email}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Leave balances</CardTitle>
            <CardDescription>Available days by leave type</CardDescription>
          </CardHeader>
          <CardContent>
            {timeOffQuery.isLoading ? (
              <Skeleton className="h-36" />
            ) : timeOffQuery.isError ? (
              <button type="button" className="w-full rounded-lg border border-destructive/30 p-4 text-left text-sm text-destructive" onClick={() => void timeOffQuery.refetch()}>
                Time-off data could not be loaded. Select to retry.
              </button>
            ) : allocations.length === 0 ? (
              <EmptyPanel>No leave balances have been allocated.</EmptyPanel>
            ) : (
              <div className="space-y-2">
                {allocations.slice(0, 4).map((allocation) => {
                  const available = Math.max(
                    0,
                    Number(allocation.allocatedDays) - Number(allocation.usedDays)
                  );
                  return (
                    <div key={allocation.id} className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                      <span className="text-sm font-medium">{allocation.leaveType}</span>
                      <span className="text-sm tabular-nums text-muted-foreground">{available} days</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent leave requests</CardTitle>
            <CardDescription>Your latest submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {timeOffQuery.isLoading ? (
              <Skeleton className="h-36" />
            ) : requests.length === 0 ? (
              <EmptyPanel>
                No leave requests yet. <Link className="text-primary underline-offset-4 hover:underline" href="/dashboard/time-off/apply">Request time off</Link>.
              </EmptyPanel>
            ) : (
              <div className="space-y-2">
                {requests.slice(0, 4).map((request) => (
                  <Link key={request.id} href="/dashboard/time-off" className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:border-primary/40">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{request.leaveType}</p>
                      <p className="text-xs text-muted-foreground">{new Date(request.startDate).toLocaleDateString()} · {request.days} day{request.days === "1" ? "" : "s"}</p>
                    </div>
                    <Badge variant="outline" className="capitalize">{request.status}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest payslip</CardTitle>
            <CardDescription>Your most recent published payroll record</CardDescription>
          </CardHeader>
          <CardContent>
            {payslipsQuery.isLoading ? (
              <Skeleton className="h-36" />
            ) : payslipsQuery.isError ? (
              <button type="button" className="w-full rounded-lg border border-destructive/30 p-4 text-left text-sm text-destructive" onClick={() => void payslipsQuery.refetch()}>
                Payroll data could not be loaded. Select to retry.
              </button>
            ) : !latestPayslip ? (
              <EmptyPanel>No payslip has been published yet.</EmptyPanel>
            ) : (
              <div className="rounded-lg border bg-muted/25 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{latestPayslip.name || `${latestPayslip.month ?? "Pay period"} ${latestPayslip.year ?? ""}`}</p>
                    <p className="mt-1 text-xs text-muted-foreground capitalize">{latestPayslip.status}</p>
                  </div>
                  <WalletCards className="size-5 text-primary" />
                </div>
                <p className="mt-5 text-xs text-muted-foreground">Net salary</p>
                <p className="text-2xl font-semibold tabular-nums">{latestPayslip.netSalary ?? "—"}</p>
                <Button render={<Link href="/dashboard/payroll" />} variant="outline" className="mt-4 w-full">View payroll</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>{unreadNotifications.length} unread update{unreadNotifications.length === 1 ? "" : "s"}</CardDescription>
            </div>
            <Button render={<Link href="/dashboard/notifications" />} variant="outline" size="sm">View all</Button>
          </CardHeader>
          <CardContent>
            {notificationsQuery.isLoading ? (
              <Skeleton className="h-28" />
            ) : notificationsQuery.isError ? (
              <button type="button" className="w-full rounded-lg border border-destructive/30 p-4 text-left text-sm text-destructive" onClick={() => void notificationsQuery.refetch()}>
                Notifications could not be loaded. Select to retry.
              </button>
            ) : (notificationsQuery.data?.length ?? 0) === 0 ? (
              <EmptyPanel>You’re all caught up.</EmptyPanel>
            ) : (
              <div className="divide-y rounded-lg border">
                {notificationsQuery.data?.slice(0, 4).map((notification) => (
                  <div key={notification.id} className="flex gap-3 p-3">
                    <Bell className={`mt-0.5 size-4 shrink-0 ${notification.read === 0 ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="min-w-0">
                      <p className="text-sm">{notification.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{new Date(notification.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
            <CardDescription>Common workday actions</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {[
              { label: "View attendance", href: "/dashboard/attendance", icon: Clock3 },
              { label: "Request time off", href: "/dashboard/time-off/apply", icon: CalendarDays },
              { label: "Open my profile", href: "/dashboard/profile", icon: BriefcaseBusiness },
              { label: "Organization", href: "/dashboard/organization", icon: Building2 },
            ].map(({ label, href, icon: Icon }) => (
              <Button key={href} render={<Link href={href} />} variant="outline" className="justify-start">
                <Icon className="size-4 text-primary" />
                {label}
                <ArrowRight className="ml-auto size-4 text-muted-foreground" />
              </Button>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
