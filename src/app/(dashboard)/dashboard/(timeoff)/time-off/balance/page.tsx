"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  CalendarClock,
  Calendar,
  Plus,
  RefreshCw,
  Plane,
  HeartPulse,
  Clock,
  ShieldAlert,
  ArrowRight,
  Info,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

import {
  useMyTimeOff,
  useLeaveAllocations,
  useSubmitLeaveRequest,
  useLeaveTypes,
} from "@/hooks/use-leave";
import { useMe } from "@/hooks/use-me";

export default function LeaveBalancePage() {
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [unit, setUnit] = useState<"full_day" | "half_day">("full_day");

  const { data: me, isLoading: meLoading } = useMe();
  const currentEmployeeId = me?.employee?.id;

  const {
    data: timeOffData,
    isLoading: timeOffLoading,
    refetch: refetchTimeOff,
    isFetching: timeOffFetching,
  } = useMyTimeOff();

  const {
    data: allocationsData = [],
    isLoading: allocationsLoading,
    refetch: refetchAllocations,
  } = useLeaveAllocations(currentEmployeeId);

  const leaveTypesQuery = useLeaveTypes();
  const leaveTypes = (leaveTypesQuery.data ?? []).filter((type) => type.active);
  const submitLeaveMutation = useSubmitLeaveRequest();

  const handleRefresh = () => {
    refetchTimeOff();
    refetchAllocations();
    toast.success("Leave balances updated");
  };

  // Combine allocations
  const allocations = useMemo(() => {
    if (allocationsData.length > 0) return allocationsData;
    return timeOffData?.allocations ?? [];
  }, [allocationsData, timeOffData]);

  const totalAllocated = useMemo(() => {
    return allocations.reduce(
      (sum, a) => sum + Number(a.allocatedDays || 0),
      0
    );
  }, [allocations]);

  const totalUsed = useMemo(() => {
    return allocations.reduce((sum, a) => sum + Number(a.usedDays || 0), 0);
  }, [allocations]);

  const totalAvailable = Math.max(0, totalAllocated - totalUsed);

  // Group leave icon and style
  const getLeaveMetadata = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes("paid") || lower.includes("annual") || lower.includes("vacation")) {
      return {
        icon: Plane,
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-500/10 border-emerald-500/20",
        barColor: "bg-emerald-500",
      };
    }
    if (lower.includes("sick") || lower.includes("medical")) {
      return {
        icon: HeartPulse,
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-500/10 border-blue-500/20",
        barColor: "bg-blue-500",
      };
    }
    if (lower.includes("casual")) {
      return {
        icon: Calendar,
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-500/10 border-amber-500/20",
        barColor: "bg-amber-500",
      };
    }
    if (lower.includes("emergency")) {
      return {
        icon: ShieldAlert,
        color: "text-rose-600 dark:text-rose-400",
        bg: "bg-rose-500/10 border-rose-500/20",
        barColor: "bg-rose-500",
      };
    }
    return {
      icon: Clock,
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
      barColor: "bg-primary",
    };
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveType || !startDate || !endDate) {
      toast.error("Choose a leave type and specify both start and end dates");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error("End date must be on or after start date");
      return;
    }

    try {
      await submitLeaveMutation.mutateAsync({
        leaveType,
        startDate,
        endDate,
        reason: reason.trim() || undefined,
        employeeId: currentEmployeeId,
        unit,
      });
      toast.success("Leave request submitted successfully for approval");
      setApplyModalOpen(false);
      setStartDate("");
      setEndDate("");
      setReason("");
      refetchTimeOff();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit leave request"
      );
    }
  };

  const isRefreshing = timeOffFetching || allocationsLoading || meLoading;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock className="size-7 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Leave Balances &amp; Quotas
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor your accrued time-off balances, annual entitlements, and leave utilization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-1.5 text-xs"
          >
            <RefreshCw
              className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </Button>

          <Button
            onClick={() => setApplyModalOpen(true)}
            size="sm"
            className="gap-1.5 text-xs"
          >
            <Plus className="size-3.5" />
            <span>Apply for Time Off</span>
          </Button>
        </div>
      </div>

      {/* Top Cumulative Summary Banner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-emerald-500/20 bg-linear-to-br from-emerald-500/5 via-card to-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Available Balance
            </CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {timeOffLoading ? <Skeleton className="h-9 w-20" /> : `${totalAvailable} Days`}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Remaining unspent days across all categories
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-linear-to-br from-blue-500/5 via-card to-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Allocated Quota
            </CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
              {timeOffLoading ? <Skeleton className="h-9 w-20" /> : `${totalAllocated} Days`}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Annual entitlement assigned for current calendar year
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-linear-to-br from-amber-500/5 via-card to-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Utilized Days
            </CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
              {timeOffLoading ? <Skeleton className="h-9 w-20" /> : `${totalUsed} Days`}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Approved leaves taken this year
          </CardContent>
        </Card>
      </div>

      {/* Individual Leave Type Balance Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight">
            Leave Categories &amp; Utilization
          </h2>
          <Button
            render={<Link href="/dashboard/time-off" />}
            variant="ghost"
            size="sm"
            className="text-xs gap-1 text-primary"
          >
            <span>View All Requests</span>
            <ChevronRight className="size-3.5" />
          </Button>
        </div>

        {timeOffLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : allocations.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <Info className="size-8 text-muted-foreground mb-2" />
              <p className="text-sm font-semibold">No Leave Quotas Allocated</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-md">
                Your employee profile has not been assigned specific leave quotas yet. Standard default policies apply.
              </p>
              <Button
                onClick={() => setApplyModalOpen(true)}
                size="sm"
                className="mt-4 gap-1.5 text-xs"
              >
                <Plus className="size-3.5" />
                Submit Request Anyway
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {allocations.map((alloc) => {
              const total = Number(alloc.allocatedDays);
              const used = Number(alloc.usedDays);
              const remaining = Math.max(0, total - used);
              const percentUsed = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
              const meta = getLeaveMetadata(alloc.leaveType);
              const Icon = meta.icon;

              return (
                <Card
                  key={alloc.id}
                  className={`overflow-hidden border transition-all hover:shadow-xs ${meta.bg}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold capitalize tracking-wide">
                        {alloc.leaveType.replaceAll("_", " ")}
                      </span>
                      <div className={`flex size-8 items-center justify-center rounded-lg ${meta.bg} ${meta.color}`}>
                        <Icon className="size-4" />
                      </div>
                    </div>
                    <CardTitle className="mt-2 text-3xl font-bold tabular-nums">
                      {remaining}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        days left
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>Used: {used} d</span>
                        <span>Total: {total} d</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${meta.barColor}`}
                          style={{ width: `${percentUsed}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed Balance Table & Guidelines */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">
                Allocation Entitlement Schedule
              </CardTitle>
              <CardDescription>
                Detailed breakdown of allocated leave quotas and balance status.
              </CardDescription>
            </div>
            <Button
              render={<Link href="/dashboard/time-off/apply" />}
              variant="outline"
              size="sm"
              className="text-xs gap-1"
            >
              <span>Apply Page</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Allocated</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeOffLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                      Loading allocations...
                    </TableCell>
                  </TableRow>
                ) : allocations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                      No custom allocation records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  allocations.map((a) => {
                    const allocated = Number(a.allocatedDays);
                    const used = Number(a.usedDays);
                    const available = Math.max(0, allocated - used);

                    return (
                      <TableRow key={a.id}>
                        <TableCell>
                          <div className="font-semibold text-sm capitalize">
                            {a.leaveType.replaceAll("_", " ")}
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            Standard Yearly Policy
                          </span>
                        </TableCell>
                        <TableCell className="tabular-nums text-sm font-medium">
                          {allocated} days
                        </TableCell>
                        <TableCell className="tabular-nums text-sm text-amber-600 font-medium">
                          {used} days
                        </TableCell>
                        <TableCell className="tabular-nums text-sm font-bold text-emerald-600">
                          {available} days
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setLeaveType(a.leaveType);
                              setApplyModalOpen(true);
                            }}
                            className="h-7 text-xs text-primary"
                          >
                            Apply
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Company Leave Policies Card */}
        <Card className="space-y-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <CardTitle className="text-base font-semibold">
                Leave Policy Guidelines
              </CardTitle>
            </div>
            <CardDescription>
              Key rules and expectations for time off.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-muted-foreground">
            <div className="rounded-lg border p-3 bg-muted/20 space-y-1">
              <p className="font-semibold text-foreground">Paid Time Off (PTO)</p>
              <p>
                Accrues monthly. Requires at least 3 business days advance notice for approval.
              </p>
            </div>
            <div className="rounded-lg border p-3 bg-muted/20 space-y-1">
              <p className="font-semibold text-foreground">Sick Leave</p>
              <p>
                For medical emergencies and illness. Absences exceeding 3 consecutive days require a medical certificate.
              </p>
            </div>
            <div className="rounded-lg border p-3 bg-muted/20 space-y-1">
              <p className="font-semibold text-foreground">Casual &amp; Emergency</p>
              <p>
                For short notice personal matters. Subject to manager review and workload coverage.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Apply For Leave Modal */}
      <Dialog open={applyModalOpen} onOpenChange={setApplyModalOpen}>
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
                <Select
                  value={leaveType}
                  onValueChange={(value) => setLeaveType(value ?? "")}
                  disabled={leaveTypesQuery.isLoading || leaveTypes.length === 0}
                >
                  <SelectTrigger id="leaveTypeSelect" className="w-full text-xs">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map((type) => (
                      <SelectItem key={type.id} value={type.name}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {leaveTypesQuery.isError ? (
                  <p className="text-xs text-destructive">Unable to load leave types. Refresh the page and try again.</p>
                ) : leaveTypesQuery.isSuccess && leaveTypes.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No leave types are available. Contact HR for assistance.</p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="startDateInput" className="text-xs font-semibold">
                    Start Date
                  </Label>
                  <Input
                    id="startDateInput"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
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
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
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
                  value={unit}
                  onValueChange={(v) => setUnit((v as "full_day" | "half_day") ?? "full_day")}
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
                  placeholder="Provide context or project handover details..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter showCloseButton>
              <Button
                type="submit"
                disabled={submitLeaveMutation.isPending || leaveTypesQuery.isLoading || leaveTypes.length === 0}
                className="text-xs"
              >
                {submitLeaveMutation.isPending ? "Submitting..." : "Submit Application"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
