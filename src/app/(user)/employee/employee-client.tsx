"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Clock,
  Calendar,
  Wallet,
  Building2,
  RefreshCw,
  ArrowRight,
  LogIn,
  LogOut,
  Plus,
  CalendarCheck,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { PortalHeader } from "../_components/portal-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useMe } from "@/hooks/use-me";
import {
  useTodayAttendance,
  useCheckIn,
  useCheckOut,
  useAttendanceCorrections,
  useRequestCorrection,
} from "@/hooks/use-attendance";
import {
  useMyTimeOff,
  useSubmitLeaveRequest,
  useLeaveTypes,
} from "@/hooks/use-leave";
import { useMyPayslips } from "@/hooks/use-payroll";
import { useHolidays } from "@/hooks/use-organization";

interface EmployeeDashboardClientProps {
  userRole: "admin" | "hr" | "manager" | "employee";
}

function formatDuration(start?: Date | string | null, end?: Date | string | null) {
  if (!start) return "0h 00m";
  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : Date.now();
  const minutes = Math.max(0, Math.floor((endMs - startMs) / 60_000));
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
}

function formatTime(value?: Date | string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function EmployeeDashboardClient({
  userRole,
}: EmployeeDashboardClientProps) {
  const [activeTab, setActiveTab] = useState("leave");

  // Live timer tick
  const [, setTick] = useState(0);

  // Apply Leave Modal State
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState("paid_leave");
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveUnit, setLeaveUnit] = useState<"full_day" | "half_day">("full_day");

  // Attendance Correction Modal State
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [correctionDate, setCorrectionDate] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");

  // Check out confirmation modal
  const [checkOutDialogOpen, setCheckOutDialogOpen] = useState(false);

  // Data Queries
  const { data: me, refetch: refetchMe } = useMe();
  const {
    data: todayAttendance,
    isLoading: attendanceLoading,
    refetch: refetchAttendance,
    isFetching: attendanceFetching,
  } = useTodayAttendance();

  const {
    data: timeOffData,
    isLoading: timeOffLoading,
    refetch: refetchTimeOff,
  } = useMyTimeOff();

  const { data: leaveTypes = [] } = useLeaveTypes();
  const { data: payslips = [], isLoading: payslipsLoading, refetch: refetchPayslips } = useMyPayslips();
  const { data: correctionsData, isLoading: correctionsLoading, refetch: refetchCorrections } = useAttendanceCorrections();
  const { data: holidays = [], isLoading: holidaysLoading, refetch: refetchHolidays } = useHolidays();
  const accessRole = me?.accessRole ?? "user";
  const hasManagerPermissions = me?.employee?.role === "manager";

  // Mutations
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();
  const submitLeaveMutation = useSubmitLeaveRequest();
  const requestCorrectionMutation = useRequestCorrection();

  // Attendance state
  const isCheckedIn = Boolean(
    todayAttendance?.checkInTime && !todayAttendance?.checkOutTime
  );
  const isCheckedOut = Boolean(todayAttendance?.checkOutTime);
  const notStarted = !todayAttendance?.checkInTime;

  // Timer interval
  useEffect(() => {
    if (!isCheckedIn) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isCheckedIn]);

  const elapsed = useMemo(() => {
    return formatDuration(
      todayAttendance?.checkInTime,
      todayAttendance?.checkOutTime
    );
  }, [todayAttendance]);

  const allocations = useMemo(
    () => timeOffData?.allocations ?? [],
    [timeOffData]
  );
  const requests = useMemo(
    () => timeOffData?.requests ?? [],
    [timeOffData]
  );
  const corrections = useMemo(
    () => correctionsData?.items ?? [],
    [correctionsData]
  );
  const latestPayslip = payslips[0];

  const handleRefresh = () => {
    refetchMe();
    refetchAttendance();
    refetchTimeOff();
    refetchPayslips();
    refetchCorrections();
    refetchHolidays();
    toast.success("Workspace data refreshed");
  };

  const handleCheckIn = async () => {
    try {
      const res = await checkInMutation.mutateAsync();
      toast.success(
        res?.checkInTime
          ? `Checked in successfully at ${formatTime(res.checkInTime)}`
          : "Checked in successfully"
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Check-in failed");
    }
  };

  const handleCheckOut = async () => {
    try {
      const res = await checkOutMutation.mutateAsync();
      toast.success(
        res?.checkInTime
          ? `Checked out successfully · Worked ${formatDuration(
              res.checkInTime,
              res.checkOutTime
            )}`
          : "Checked out successfully"
      );
      setCheckOutDialogOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Check-out failed");
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStartDate || !leaveEndDate) {
      toast.error("Please select start and end dates");
      return;
    }
    if (new Date(leaveStartDate) > new Date(leaveEndDate)) {
      toast.error("End date must be on or after start date");
      return;
    }

    try {
      await submitLeaveMutation.mutateAsync({
        leaveType,
        startDate: leaveStartDate,
        endDate: leaveEndDate,
        reason: leaveReason.trim() || undefined,
        employeeId: me?.employee?.id,
      });
      toast.success("Leave application submitted for approval");
      setLeaveModalOpen(false);
      setLeaveStartDate("");
      setLeaveEndDate("");
      setLeaveReason("");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit leave request"
      );
    }
  };

  const handleRequestCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionDate) {
      toast.error("Please specify the correction date");
      return;
    }
    if (!correctionReason.trim() || correctionReason.trim().length < 3) {
      toast.error("Please provide a reason (minimum 3 characters)");
      return;
    }

    try {
      await requestCorrectionMutation.mutateAsync({
        correctionDate,
        reason: correctionReason.trim(),
      });
      toast.success("Attendance correction requested successfully");
      setCorrectionModalOpen(false);
      setCorrectionDate("");
      setCorrectionReason("");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to request attendance correction"
      );
    }
  };

  const initials = me?.employee
    ? `${me.employee.firstName[0] || ""}${me.employee.lastName[0] || ""}`.toUpperCase()
    : (me?.user.name?.slice(0, 2) || "U").toUpperCase();

  return (
    <div className="min-h-screen bg-muted/10 pb-16">
      <PortalHeader
        portalTitle="User Workspace"
        portalRole={userRole}
        badgeLabel="Self-Service Hub"
        description="Daily punch clock, leave applications, payroll slips, and profile details."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={attendanceFetching}
          className="gap-1.5 text-xs"
        >
          <RefreshCw
            className={`size-3.5 ${attendanceFetching ? "animate-spin" : ""}`}
          />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </PortalHeader>

      <main className="mx-auto max-w-7xl space-y-6 px-4 pt-6 sm:px-6 lg:px-8">
        {/* Welcome Banner */}
        <section className="flex flex-col gap-4 rounded-2xl border bg-gradient-to-r from-card to-muted/30 p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar size="lg" className="size-14 ring-2 ring-primary/20">
              {me?.user.image && <AvatarImage src={me.user.image} />}
              <AvatarFallback className="bg-primary text-base font-bold text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight md:text-2xl">
                  Welcome, {me?.employee?.firstName || me?.user.name || "User"}!
                </h1>
                <Badge variant="outline" className="capitalize text-xs font-semibold">
                  {accessRole}
                </Badge>
                {hasManagerPermissions ? (
                  <Badge variant="secondary" className="text-xs">
                    Manager permissions
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {me?.employee?.employeeNumber ? (
                  <span className="font-mono">{me.employee.employeeNumber} • </span>
                ) : null}
                {me?.user.email}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setLeaveModalOpen(true)}
              size="sm"
              className="gap-1.5 text-xs"
            >
              <Plus className="size-3.5" />
              Apply for Leave
            </Button>
            <Button
              onClick={() => setCorrectionModalOpen(true)}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
            >
              <Clock className="size-3.5" />
              Correct Punch
            </Button>
          </div>
        </section>

        {/* Workday Pulse & Attendance Clock Card */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-primary/20 shadow-xs">
            <CardHeader className="flex flex-row items-start justify-between pb-3 bg-primary/5 rounded-t-xl border-b">
              <div>
                <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                  Workday Punch Clock
                </CardDescription>
                <CardTitle className="mt-1 flex items-center gap-2 text-xl font-bold">
                  <span
                    className={`size-2.5 rounded-full ${
                      isCheckedIn
                        ? "animate-pulse bg-emerald-500"
                        : isCheckedOut
                        ? "bg-primary"
                        : "bg-muted-foreground/40"
                    }`}
                  />
                  {isCheckedIn
                    ? "Currently Checked In"
                    : isCheckedOut
                    ? "Shift Finished for Today"
                    : "Not Checked In Today"}
                </CardTitle>
              </div>
              <Badge
                variant="outline"
                className={
                  todayAttendance?.status === "late"
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                }
              >
                {todayAttendance?.status
                  ? todayAttendance.status.replaceAll("_", " ")
                  : "Ready"}
              </Badge>
            </CardHeader>
            <CardContent className="p-5">
              {attendanceLoading ? (
                <div className="grid grid-cols-3 gap-3">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border bg-muted/20 p-3.5">
                      <span className="text-xs text-muted-foreground">Check In Time</span>
                      <p className="mt-1 text-lg font-semibold tabular-nums">
                        {formatTime(todayAttendance?.checkInTime)}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3.5">
                      <span className="text-xs text-muted-foreground">Work Duration</span>
                      <p className="mt-1 text-lg font-semibold tabular-nums text-primary">
                        {elapsed}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3.5">
                      <span className="text-xs text-muted-foreground">Check Out Time</span>
                      <p className="mt-1 text-lg font-semibold tabular-nums">
                        {formatTime(todayAttendance?.checkOutTime)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs text-muted-foreground">
                      Standard Schedule: 09:00 AM – 06:00 PM • Automatic Break Calculation
                    </div>
                    <div>
                      {isCheckedIn ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setCheckOutDialogOpen(true)}
                          disabled={checkOutMutation.isPending}
                          className="gap-1.5 text-xs font-semibold"
                        >
                          <LogOut className="size-3.5" />
                          Check Out
                        </Button>
                      ) : notStarted ? (
                        <Button
                          size="sm"
                          onClick={handleCheckIn}
                          disabled={checkInMutation.isPending}
                          className="gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <LogIn className="size-3.5" />
                          {checkInMutation.isPending ? "Checking in..." : "Check In Now"}
                        </Button>
                      ) : (
                        <Button
                          render={<Link href="/dashboard/attendance" />}
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs"
                        >
                          <span>Attendance History</span>
                          <ArrowRight className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Latest Payslip Quick Glance Card */}
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                  Latest Compensation
                </CardDescription>
                <Wallet className="size-4 text-primary" />
              </div>
              <CardTitle className="text-lg">
                {latestPayslip
                  ? latestPayslip.name || `${latestPayslip.month ?? "Pay period"} ${latestPayslip.year ?? ""}`
                  : "Payslip Summary"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {payslipsLoading ? (
                <Skeleton className="h-24" />
              ) : !latestPayslip ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                  No published payslips recorded for your account yet.
                </div>
              ) : (
                <div className="rounded-lg border bg-muted/20 p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-muted-foreground">Net Pay Disbursed</span>
                    <Badge variant="secondary" className="capitalize text-[10px]">
                      {latestPayslip.status}
                    </Badge>
                  </div>
                  <div className="mt-2 text-2xl font-bold tabular-nums">
                    {latestPayslip.netSalary ?? "—"}
                  </div>
                  <Button
                    render={<Link href="/dashboard/payroll" />}
                    variant="ghost"
                    size="sm"
                    className="mt-3 w-full text-xs gap-1"
                  >
                    <span>View Payslips</span>
                    <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Leave Balances Grid */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">
              My Leave Balances
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLeaveModalOpen(true)}
              className="h-7 text-xs text-primary gap-1"
            >
              <Plus className="size-3" />
              Apply Leave
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {timeOffLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))
            ) : allocations.length === 0 ? (
              <div className="col-span-full rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                No leave allocations currently assigned. Contact HR for your yearly quota.
              </div>
            ) : (
              allocations.map((alloc) => {
                const total = Number(alloc.allocatedDays);
                const used = Number(alloc.usedDays);
                const available = Math.max(0, total - used);

                return (
                  <Card key={alloc.id} className="border-border/60 shadow-2xs">
                    <CardHeader className="pb-2">
                      <CardDescription className="text-xs font-medium capitalize">
                        {alloc.leaveType.replaceAll("_", " ")}
                      </CardDescription>
                      <CardTitle className="text-2xl font-bold tabular-nums text-primary">
                        {available} <span className="text-xs font-normal text-muted-foreground">days left</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2 mt-1">
                        <span>Used: {used} d</span>
                        <span>Total: {total} d</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </section>

        {/* Main Tabbed Details Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
            <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:flex sm:flex-wrap">
              <TabsTrigger value="leave" className="gap-2">
                <Calendar className="size-4" />
                <span>My Time Off Requests ({requests.length})</span>
              </TabsTrigger>
              <TabsTrigger value="attendance" className="gap-2">
                <CalendarCheck className="size-4" />
                <span>Corrections Log ({corrections.length})</span>
              </TabsTrigger>
              <TabsTrigger value="payroll" className="gap-2">
                <Wallet className="size-4" />
                <span>Payslips History ({payslips.length})</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-2">
                <User className="size-4" />
                <span>My Profile</span>
              </TabsTrigger>
              <TabsTrigger value="holidays" className="gap-2">
                <Building2 className="size-4" />
                <span>Holidays ({holidays.length})</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: MY TIME OFF REQUESTS */}
          <TabsContent value="leave" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-semibold">
                    My Leave Requests
                  </CardTitle>
                  <CardDescription>
                    Status of your submitted time-off applications.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setLeaveModalOpen(true)}
                  size="sm"
                  className="gap-1 text-xs"
                >
                  <Plus className="size-3.5" />
                  New Request
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Feedback / Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeOffLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                          Loading your leave requests...
                        </TableCell>
                      </TableRow>
                    ) : requests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                          You haven&apos;t submitted any leave requests yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      requests.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell>
                            <Badge variant="outline" className="capitalize text-xs">
                              {req.leaveType.replaceAll("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs tabular-nums">
                            {new Date(req.startDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-xs tabular-nums">
                            {new Date(req.endDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-xs tabular-nums">
                            {req.days} {Number(req.days) === 1 ? "day" : "days"} ({req.unit})
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                            {req.reason || "No comment"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                req.status.toLowerCase() === "approved"
                                  ? "default"
                                  : req.status.toLowerCase() === "rejected"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="capitalize text-xs"
                            >
                              {req.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                            {req.rejectionReason || req.decisionComment || "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: CORRECTIONS LOG */}
          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Attendance Corrections
                  </CardTitle>
                  <CardDescription>
                    Adjustments requested for missed or inaccurate check-ins.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setCorrectionModalOpen(true)}
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs"
                >
                  <Clock className="size-3.5" />
                  Request Correction
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Correction Date</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Submitted On</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {correctionsLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-28 text-center text-muted-foreground">
                          Loading corrections...
                        </TableCell>
                      </TableRow>
                    ) : corrections.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-28 text-center text-muted-foreground">
                          No attendance corrections requested.
                        </TableCell>
                      </TableRow>
                    ) : (
                      corrections.map((corr) => (
                        <TableRow key={corr.id}>
                          <TableCell className="text-xs tabular-nums font-medium">
                            {corr.correctionDate
                              ? new Date(corr.correctionDate).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-md">
                            {corr.reason || "Manual punch update"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground tabular-nums">
                            {new Date(corr.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary" className="text-xs">
                              Logged
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: PAYSLIPS HISTORY */}
          <TabsContent value="payroll" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-semibold">
                    My Payslips Record
                  </CardTitle>
                  <CardDescription>
                    Historical payment statements issued to you.
                  </CardDescription>
                </div>
                <Button
                  render={<Link href="/dashboard/payroll" />}
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1"
                >
                  <span>Full Payroll</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period Name</TableHead>
                      <TableHead>Month / Year</TableHead>
                      <TableHead>Gross</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Net Salary</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payslipsLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                          Loading payslip history...
                        </TableCell>
                      </TableRow>
                    ) : payslips.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                          No payslips have been published yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      payslips.map((slip) => (
                        <TableRow key={slip.id}>
                          <TableCell className="font-medium text-xs">
                            {slip.name || `Pay Slip #${slip.id}`}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {slip.month ? `${slip.month} ${slip.year ?? ""}` : "—"}
                          </TableCell>
                          <TableCell className="text-xs tabular-nums">
                            {slip.grossSalary ?? "—"}
                          </TableCell>
                          <TableCell className="text-xs tabular-nums text-destructive">
                            {slip.deductions ?? "—"}
                          </TableCell>
                          <TableCell className="text-xs tabular-nums font-semibold text-primary">
                            {slip.netSalary ?? "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize text-xs">
                              {slip.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: MY PROFILE */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Personal & Employment Profile
                </CardTitle>
                <CardDescription>
                  Your current records in Dayflow HRMS.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  <div className="rounded-lg border p-4 bg-muted/20">
                    <p className="text-xs text-muted-foreground">Full Name</p>
                    <p className="mt-1 text-sm font-semibold">
                      {me?.employee
                        ? `${me.employee.firstName} ${me.employee.lastName}`
                        : me?.user.name || "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4 bg-muted/20">
                    <p className="text-xs text-muted-foreground">Work Email</p>
                    <p className="mt-1 text-sm font-semibold">{me?.user.email}</p>
                  </div>
                  <div className="rounded-lg border p-4 bg-muted/20">
                    <p className="text-xs text-muted-foreground">Employee ID</p>
                    <p className="mt-1 text-sm font-mono font-semibold">
                      {me?.employee?.employeeNumber || `EMP #${me?.employee?.id || "N/A"}`}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4 bg-muted/20">
                    <p className="text-xs text-muted-foreground">Access Role</p>
                    <p className="mt-1 text-sm font-semibold capitalize">
                      {accessRole}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4 bg-muted/20">
                    <p className="text-xs text-muted-foreground">Employment Status</p>
                    <p className="mt-1 text-sm font-semibold capitalize">
                      {me?.employee?.employmentStatus?.replaceAll("_", " ") || "Active"}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4 bg-muted/20">
                    <p className="text-xs text-muted-foreground">Employment Type</p>
                    <p className="mt-1 text-sm font-semibold capitalize">
                      {me?.employee?.employmentType?.replaceAll("_", " ") || "Full Time"}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    render={<Link href="/dashboard/profile" />}
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1"
                  >
                    <span>Full Profile & Document Settings</span>
                    <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: HOLIDAYS */}
          <TabsContent value="holidays" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Company Holiday Calendar
                </CardTitle>
                <CardDescription>
                  Official holidays and office closure dates.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {holidaysLoading ? (
                  <Skeleton className="h-32" />
                ) : holidays.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No holidays scheduled.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {holidays.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center gap-3 rounded-lg border p-3.5 bg-card"
                      >
                        <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <span className="text-[10px] font-bold uppercase">
                            {new Date(h.holidayDate).toLocaleDateString(undefined, {
                              month: "short",
                            })}
                          </span>
                          <span className="text-base font-bold leading-none">
                            {new Date(h.holidayDate).getDate()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{h.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {h.description || "Public Holiday"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Apply For Leave Modal */}
      <Dialog open={leaveModalOpen} onOpenChange={setLeaveModalOpen}>
        <DialogContent>
          <form onSubmit={handleApplyLeave} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Apply for Time Off</DialogTitle>
              <DialogDescription>
                Submit a leave request for review and approval by your manager or HR.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="leaveTypeSelect" className="text-xs font-semibold">
                  Leave Type
                </Label>
                <Select value={leaveType} onValueChange={(v) => setLeaveType(v ?? "paid_leave")}>
                  <SelectTrigger id="leaveTypeSelect" className="w-full text-xs">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.length > 0 ? (
                      leaveTypes.map((t) => (
                        <SelectItem key={t.id} value={t.name.toLowerCase().replaceAll(" ", "_")}>
                          {t.name}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="paid_leave">Paid Annual Leave</SelectItem>
                        <SelectItem value="casual_leave">Casual Leave</SelectItem>
                        <SelectItem value="sick_leave">Sick Leave</SelectItem>
                        <SelectItem value="emergency_leave">Emergency Leave</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="startDateInput" className="text-xs font-semibold">
                    Start Date
                  </Label>
                  <Input
                    id="startDateInput"
                    type="date"
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="endDateInput" className="text-xs font-semibold">
                    End Date
                  </Label>
                  <Input
                    id="endDateInput"
                    type="date"
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="unitSelect" className="text-xs font-semibold">
                  Duration Unit
                </Label>
                <Select
                  value={leaveUnit}
                  onValueChange={(v) => setLeaveUnit((v as "full_day" | "half_day") ?? "full_day")}
                >
                  <SelectTrigger id="unitSelect" className="w-full text-xs">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_day">Full Day</SelectItem>
                    <SelectItem value="half_day">Half Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="reasonInput" className="text-xs font-semibold">
                  Reason / Notes
                </Label>
                <Textarea
                  id="reasonInput"
                  placeholder="Provide context or handover details..."
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter showCloseButton>
              <Button
                type="submit"
                disabled={submitLeaveMutation.isPending}
                className="text-xs"
              >
                {submitLeaveMutation.isPending ? "Submitting..." : "Submit Application"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Attendance Correction Modal */}
      <Dialog open={correctionModalOpen} onOpenChange={setCorrectionModalOpen}>
        <DialogContent>
          <form onSubmit={handleRequestCorrection} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Request Punch Correction</DialogTitle>
              <DialogDescription>
                Submit a correction if your check-in or check-out was missed or recorded incorrectly.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="corrDate" className="text-xs font-semibold">
                  Date of Missed / Erroneous Punch
                </Label>
                <Input
                  id="corrDate"
                  type="date"
                  value={correctionDate}
                  onChange={(e) => setCorrectionDate(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="corrReason" className="text-xs font-semibold">
                  Correction Reason & Details
                </Label>
                <Textarea
                  id="corrReason"
                  placeholder="e.g. Card scanner failed or network timeout during morning punch at 09:05 AM..."
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  required
                  rows={3}
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter showCloseButton>
              <Button
                type="submit"
                disabled={requestCorrectionMutation.isPending}
                className="text-xs"
              >
                {requestCorrectionMutation.isPending ? "Submitting..." : "Submit Correction"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Check Out Confirmation Dialog */}
      <Dialog open={checkOutDialogOpen} onOpenChange={setCheckOutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finish Today&apos;s Shift?</DialogTitle>
            <DialogDescription>
              Dayflow will record your final clock-out timestamp and compute your completed work hours.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <Button
              variant="destructive"
              onClick={handleCheckOut}
              disabled={checkOutMutation.isPending}
            >
              {checkOutMutation.isPending ? "Checking out..." : "Finish Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
