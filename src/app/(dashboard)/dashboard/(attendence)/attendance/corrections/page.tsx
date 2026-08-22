"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Clock3,
  Search,
  RefreshCw,
  Plus,
  ArrowRight,
  FileCheck2,
} from "lucide-react";
import { toast } from "sonner";

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
import { Textarea } from "@/components/ui/textarea";
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
import { Skeleton } from "@/components/ui/skeleton";

import {
  useAttendanceCorrections,
  useRequestCorrection,
} from "@/hooks/use-attendance";
import { useEmployees } from "@/hooks/use-employees";
import { useMe } from "@/hooks/use-me";

export default function AttendanceCorrectionsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [correctionDate, setCorrectionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [requestedCheckIn, setRequestedCheckIn] = useState("09:00");
  const [requestedCheckOut, setRequestedCheckOut] = useState("18:00");
  const [reason, setReason] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const { data: me } = useMe();
  const role = (me?.employee?.role ?? me?.user.role ?? "employee").toLowerCase();
  const isManagement = role === "manager" || role === "hr" || role === "admin";

  const {
    data: correctionsData,
    isLoading: correctionsLoading,
    refetch: refetchCorrections,
    isFetching: correctionsFetching,
  } = useAttendanceCorrections({ limit: 100 });

  const { data: employeesData } = useEmployees({ limit: 200 });
  const requestCorrectionMutation = useRequestCorrection();

  const corrections = useMemo(
    () => correctionsData?.items ?? [],
    [correctionsData]
  );

  const employees = useMemo(
    () => employeesData?.items ?? [],
    [employeesData]
  );

  const employeeMap = useMemo(() => {
    const map = new Map<string, (typeof employees)[0]>();
    employees.forEach((emp) => {
      map.set(emp.id.toString(), emp);
      if (emp.userId) map.set(emp.userId, emp);
    });
    return map;
  }, [employees]);

  const handleRefresh = () => {
    refetchCorrections();
    toast.success("Attendance corrections refreshed");
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionDate) {
      toast.error("Please specify the date of the missed punch");
      return;
    }
    if (!reason.trim() || reason.trim().length < 3) {
      toast.error("Please provide a reason (minimum 3 characters)");
      return;
    }

    try {
      await requestCorrectionMutation.mutateAsync({
        correctionDate: new Date(`${correctionDate}T12:00:00`).toISOString(),
        requestedCheckInTime: new Date(
          `${correctionDate}T${requestedCheckIn}:00`,
        ).toISOString(),
        ...(requestedCheckOut && {
          requestedCheckOutTime: new Date(
            `${correctionDate}T${requestedCheckOut}:00`,
          ).toISOString(),
        }),
        reason: reason.trim(),
      });

      toast.success("Attendance correction request submitted for review");
      setIsModalOpen(false);
      setReason("");
      refetchCorrections();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to submit correction request"
      );
    }
  };

  // Filtered corrections
  const filteredCorrections = useMemo(() => {
    return corrections.filter((item) => {
      const emp = employeeMap.get(item.userId);
      const fullName = emp ? `${emp.firstName} ${emp.lastName}`.toLowerCase() : "";
      const matchesSearch =
        !searchQuery ||
        item.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fullName.includes(searchQuery.toLowerCase()) ||
        (item.reason && item.reason.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSearch;
    });
  }, [corrections, employeeMap, searchQuery]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="size-7 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Attendance Corrections
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Review punch adjustment requests, report missed clock-ins, and manage timesheet corrections.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={correctionsFetching}
            className="gap-1.5 text-xs"
          >
            <RefreshCw
              className={`size-3.5 ${correctionsFetching ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </Button>

          <Button
            onClick={() => setIsModalOpen(true)}
            size="sm"
            className="gap-1.5 text-xs"
          >
            <Plus className="size-3.5" />
            <span>Request Correction</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-primary/20 bg-linear-to-br from-primary/5 via-card to-card">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
              <span>Total Logged Requests</span>
              <FileCheck2 className="size-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums text-primary">
              {correctionsLoading ? <Skeleton className="h-9 w-14" /> : corrections.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Adjustment tickets recorded
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-linear-to-br from-blue-500/5 via-card to-card">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
              <span>Review Status</span>
              <Clock3 className="size-4 text-blue-600 dark:text-blue-400" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
              {correctionsLoading ? <Skeleton className="h-9 w-14" /> : corrections.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Processed via approvals pipeline
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-linear-to-br from-emerald-500/5 via-card to-card">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
              <span>Approvals Hub</span>
              <CalendarCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
            </CardDescription>
            <CardTitle className="text-sm font-semibold mt-2">
              {isManagement ? "Manager & HR Access" : "Self-Service Portal"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              render={<Link href="/dashboard/approvals" />}
              variant="ghost"
              size="sm"
              className="p-0 h-auto text-xs text-primary gap-1 font-medium"
            >
              <span>Go to Approvals Center</span>
              <ArrowRight className="size-3" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Corrections Table Card */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <CardTitle className="text-base font-semibold">
              Correction Requests Log ({filteredCorrections.length})
            </CardTitle>
            <CardDescription>
              All punch adjustment submissions recorded in the database.
            </CardDescription>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search user ID, employee, reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User / Employee</TableHead>
                <TableHead>Work Date</TableHead>
                <TableHead>Reason &amp; Explanation</TableHead>
                <TableHead>Submitted On</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {correctionsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="py-4">
                      <Skeleton className="h-7 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredCorrections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No attendance correction requests recorded.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCorrections.map((item) => {
                  const emp = employeeMap.get(item.userId);
                  const empName = emp ? `${emp.firstName} ${emp.lastName}` : `User #${item.userId}`;

                  return (
                    <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="font-medium text-sm text-foreground">{empName}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {item.userId}
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums text-sm font-semibold text-primary">
                        {item.correctionDate
                          ? new Date(item.correctionDate).toLocaleDateString("en-US", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-md">
                        {item.reason || "Manual punch adjustment request"}
                      </TableCell>
                      <TableCell className="tabular-nums text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="text-xs font-semibold capitalize">
                          Logged
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Request Attendance Correction Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <form onSubmit={handleRequestSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Request Attendance Correction</DialogTitle>
              <DialogDescription>
                Submit a correction if your check-in or check-out punch was missed or inaccurate.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="corrDate" className="text-xs font-semibold">
                  Work Date of Missed / Inaccurate Punch
                </Label>
                <Input
                  id="corrDate"
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  value={correctionDate}
                  onChange={(e) => setCorrectionDate(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="corrCheckIn" className="text-xs font-semibold">
                    Requested Check-In
                  </Label>
                  <Input
                    id="corrCheckIn"
                    type="time"
                    value={requestedCheckIn}
                    onChange={(e) => setRequestedCheckIn(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="corrCheckOut" className="text-xs font-semibold">
                    Requested Check-Out
                  </Label>
                  <Input
                    id="corrCheckOut"
                    type="time"
                    value={requestedCheckOut}
                    onChange={(e) => setRequestedCheckOut(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="corrReason" className="text-xs font-semibold">
                  Reason &amp; Explanation (Min 3 characters)
                </Label>
                <Textarea
                  id="corrReason"
                  placeholder="e.g. Card scanner malfunction or network timeout during morning punch..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
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
                {requestCorrectionMutation.isPending
                  ? "Submitting..."
                  : "Submit Correction"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
