"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  CalendarCheck,
  LogIn,
  LogOut,
  Search,
  Filter,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock3,
  UserCheck,
  ChevronLeft,
  ChevronRight,
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
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  useAttendance,
  useCheckIn,
  useCheckOut,
  useRequestCorrection,
  useTodayAttendance,
} from "@/hooks/use-attendance";
import { useEmployees } from "@/hooks/use-employees";
import { useMe } from "@/hooks/use-me";

export default function AttendancePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [currentTimeStr, setCurrentTimeStr] = useState("");

  // Manual entry modal form state
  const [manualUserId, setManualUserId] = useState("");
  const [manualDate, setManualDate] = useState(new Date().toISOString().split("T")[0]);
  const [manualCheckIn, setManualCheckIn] = useState("09:00");
  const [manualCheckOut, setManualCheckOut] = useState("18:00");
  const [manualStatus, setManualStatus] = useState("present");
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [correctionDate, setCorrectionDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [correctedCheckIn, setCorrectedCheckIn] = useState("09:00");
  const [correctedCheckOut, setCorrectedCheckOut] = useState("18:00");
  const [correctionReason, setCorrectionReason] = useState("");

  useEffect(() => {
    const updateTime = () => setCurrentTimeStr(new Date().toLocaleTimeString());
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const { data: attendanceData, isLoading, isError, error, refetch } = useAttendance({ limit: 100 });
  const { data: employeesData } = useEmployees({ limit: 100 });
  const { data: me } = useMe();
  const role = (me?.user.role ?? me?.employee?.role ?? "employee").toLowerCase();
  const canManageAttendance = role === "hr" || role === "admin";
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();
  const todayAttendanceQuery = useTodayAttendance();
  const requestCorrectionMutation = useRequestCorrection();
  const hasCheckedIn = Boolean(todayAttendanceQuery.data?.checkInTime);
  const hasCheckedOut = Boolean(todayAttendanceQuery.data?.checkOutTime);

  const attendances = useMemo(
    () => attendanceData?.items ?? [],
    [attendanceData?.items]
  );
  const employees = useMemo(() => {
    const map: Record<string, { firstName: string; lastName: string; email: string }> = {};
    (employeesData?.items ?? []).forEach((emp) => {
      map[emp.id.toString()] = emp;
      if (emp.userId) map[emp.userId] = emp;
    });
    return map;
  }, [employeesData]);

  // Handle Punch In
  const handleCheckIn = async () => {
    try {
      await checkInMutation.mutateAsync();
      toast.success("Checked in successfully!");
      refetch();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to check in";
      toast.error(errorMsg);
    }
  };

  // Handle Punch Out
  const handleCheckOut = async () => {
    try {
      await checkOutMutation.mutateAsync();
      toast.success("Checked out successfully!");
      refetch();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to check out";
      toast.error(errorMsg);
    }
  };

  // Handle Manual Entry
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const checkInDateTime = new Date(`${manualDate}T${manualCheckIn}:00`);
      const checkOutDateTime = manualCheckOut
        ? new Date(`${manualDate}T${manualCheckOut}:00`)
        : null;

      const res = await fetch("/api/v1/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: manualUserId,
          date: new Date(manualDate),
          checkInTime: checkInDateTime,
          checkOutTime: checkOutDateTime,
          status: manualStatus,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Attendance entry created!");
        setIsManualOpen(false);
        refetch();
      } else {
        toast.error(data.error || "Failed to save entry");
      }
    } catch {
      toast.error("Failed to submit manual attendance");
    }
  };

  const handleCorrectionSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await requestCorrectionMutation.mutateAsync({
        correctionDate: new Date(`${correctionDate}T12:00:00`).toISOString(),
        requestedCheckInTime: new Date(
          `${correctionDate}T${correctedCheckIn}:00`,
        ).toISOString(),
        ...(correctedCheckOut && {
          requestedCheckOutTime: new Date(
            `${correctionDate}T${correctedCheckOut}:00`,
          ).toISOString(),
        }),
        reason: correctionReason,
      });
      toast.success("Attendance correction submitted for review");
      setCorrectionReason("");
      setIsCorrectionOpen(false);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to request correction",
      );
    }
  };

  // Filtered & Paginated records
  const filteredRecords = useMemo(() => {
    return attendances.filter((record) => {
      const emp = employees[record.userId];
      const fullName = emp ? `${emp.firstName} ${emp.lastName}`.toLowerCase() : "";
      const matchesSearch =
        record.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fullName.includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        record.status?.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [attendances, employees, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredRecords.length / limit) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredRecords.slice(start, start + limit);
  }, [filteredRecords, page, limit]);

  // Summary Metrics
  const presentCount = attendances.filter(
    (a) => a.status?.toLowerCase() === "present"
  ).length;
  const lateCount = attendances.filter(
    (a) => a.status?.toLowerCase() === "late"
  ).length;
  const leaveCount = attendances.filter(
    (a) => a.status?.toLowerCase() === "leave" || a.status?.toLowerCase() === "absent"
  ).length;

  // Calculate duration helper
  const calculateDuration = (inTime?: string | Date | null, outTime?: string | Date | null) => {
    if (!inTime) return "-";
    const start = new Date(inTime).getTime();
    const end = outTime ? new Date(outTime).getTime() : new Date().getTime();
    const diffHours = (end - start) / (1000 * 60 * 60);
    if (diffHours < 0) return "0h 0m";
    const hours = Math.floor(diffHours);
    const minutes = Math.floor((diffHours - hours) * 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
            <CalendarCheck className="size-7 text-primary" />
            Attendance Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Track daily employee punches, work shifts, punctuality, and attendance logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetch();
              toast.success("Attendance data refreshed");
            }}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Drawer open={isCorrectionOpen} onOpenChange={setIsCorrectionOpen}>
            <DrawerTrigger
              render={<Button size="sm" variant="outline" className="gap-1.5" />}
            >
              <Clock3 className="size-4" />
              Request correction
            </DrawerTrigger>
            <DrawerContent>
              <form onSubmit={handleCorrectionSubmit}>
                <DrawerHeader>
                  <DrawerTitle>Request attendance correction</DrawerTitle>
                  <DrawerDescription>
                    Enter the corrected punch times. Your manager or HR will review the request.
                  </DrawerDescription>
                </DrawerHeader>
                <div className="mx-auto grid w-full max-w-md gap-4 p-4">
                  <div className="grid gap-2">
                    <Label htmlFor="correction-date">Work date</Label>
                    <Input
                      id="correction-date"
                      type="date"
                      max={new Date().toISOString().split("T")[0]}
                      value={correctionDate}
                      onChange={(event) => setCorrectionDate(event.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="corrected-check-in">Correct check-in</Label>
                      <Input
                        id="corrected-check-in"
                        type="time"
                        value={correctedCheckIn}
                        onChange={(event) => setCorrectedCheckIn(event.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="corrected-check-out">Correct check-out</Label>
                      <Input
                        id="corrected-check-out"
                        type="time"
                        value={correctedCheckOut}
                        onChange={(event) => setCorrectedCheckOut(event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="correction-reason">Reason</Label>
                    <Input
                      id="correction-reason"
                      value={correctionReason}
                      onChange={(event) => setCorrectionReason(event.target.value)}
                      placeholder="Explain what needs to be corrected"
                      minLength={3}
                      required
                    />
                  </div>
                </div>
                <DrawerFooter className="mx-auto w-full max-w-md">
                  <Button type="submit" disabled={requestCorrectionMutation.isPending}>
                    {requestCorrectionMutation.isPending ? "Submitting…" : "Submit request"}
                  </Button>
                  <DrawerClose render={<Button variant="outline" />}>
                    Cancel
                  </DrawerClose>
                </DrawerFooter>
              </form>
            </DrawerContent>
          </Drawer>

          {canManageAttendance ? (
            <Drawer open={isManualOpen} onOpenChange={setIsManualOpen}>
            <DrawerTrigger
              render={<Button size="sm" className="gap-1.5 bg-primary text-primary-foreground" />}
            >
                <Plus className="size-4" />
                Add Record
            </DrawerTrigger>
            <DrawerContent>
              <form onSubmit={handleManualSubmit}>
                <DrawerHeader>
                  <DrawerTitle>Manual Attendance Log</DrawerTitle>
                  <DrawerDescription>
                    Record or adjust attendance entry for an employee.
                  </DrawerDescription>
                </DrawerHeader>
                <div className="grid gap-4 p-4 max-w-md mx-auto">
                  <div className="grid gap-2">
                    <Label htmlFor="employee">Employee / User ID</Label>
                    <Input
                      id="employee"
                      value={manualUserId}
                      onChange={(e) => setManualUserId(e.target.value)}
                      placeholder="e.g. usr_emp_01"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="checkIn">Check In Time</Label>
                      <Input
                        id="checkIn"
                        type="time"
                        value={manualCheckIn}
                        onChange={(e) => setManualCheckIn(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="checkOut">Check Out Time</Label>
                      <Input
                        id="checkOut"
                        type="time"
                        value={manualCheckOut}
                        onChange={(e) => setManualCheckOut(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={manualStatus} onValueChange={(val) => { if (val) setManualStatus(val); }}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="late">Late</SelectItem>
                        <SelectItem value="half_day">Half Day</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="leave">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DrawerFooter className="max-w-md mx-auto w-full">
                  <Button type="submit">Save Entry</Button>
                  <DrawerClose render={<Button variant="outline" />}>
                    Cancel
                  </DrawerClose>
                </DrawerFooter>
              </form>
            </DrawerContent>
            </Drawer>
          ) : null}
        </div>
      </div>

      {/* Live Punch Clock Widget & Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Punch Clock Card */}
        <Card className="border-primary/20 bg-linear-to-br from-primary/5 via-card to-card">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Punch Clock</span>
              <Badge variant="outline" className="gap-1">
                Live
              </Badge>
            </CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              {currentTimeStr || "--:--:--"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex gap-2">
              <Button
                onClick={handleCheckIn}
                disabled={checkInMutation.isPending || hasCheckedIn || todayAttendanceQuery.isLoading}
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                <LogIn className="size-4" />
                Check In
              </Button>
              <Button
                onClick={handleCheckOut}
                disabled={checkOutMutation.isPending || !hasCheckedIn || hasCheckedOut || todayAttendanceQuery.isLoading}
                variant="destructive"
                className="w-full gap-2 shadow-sm"
              >
                <LogOut className="size-4" />
                Check Out
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Record your daily work shift with one click
            </p>
          </CardContent>
        </Card>

        {/* Present Metric */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Present Today</span>
              <UserCheck className="size-4 text-emerald-500" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{presentCount}</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <CheckCircle2 className="size-3.5" />
              Active on duty
            </div>
          </CardContent>
        </Card>

        {/* Late Arrival Metric */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Late Arrivals</span>
              <Clock3 className="size-4 text-amber-500" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{lateCount}</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
              <AlertCircle className="size-3.5" />
              After grace time
            </div>
          </CardContent>
        </Card>

        {/* Absent / Leave Metric */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>On Leave / Absent</span>
              <CalendarCheck className="size-4 text-rose-500" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{leaveCount}</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Approved time off &amp; absences
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Logs Table Card */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Attendance Logs ({filteredRecords.length})</CardTitle>
            <CardDescription>
              Real-time synchronization with attendance tracking backend.
            </CardDescription>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search user or employee..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-8"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(val: string | null) => {
                if (val) {
                  setStatusFilter(val);
                  setPage(1);
                }
              }}
            >
              <SelectTrigger className="w-[130px]">
                <Filter className="size-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="half_day">Half Day</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="leave">Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[100px]">Record ID</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Work Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <RefreshCw className="size-6 animate-spin text-primary" />
                        <span>Loading attendance records...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-3 text-sm text-destructive">
                        <span>Attendance records could not be loaded: {error.message}</span>
                        <Button variant="outline" size="sm" onClick={() => void refetch()}>
                          Try again
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      No attendance records found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRecords.map((item) => {
                    const emp = employees[item.userId];
                    const empName = emp ? `${emp.firstName} ${emp.lastName}` : `User #${item.userId}`;
                    const statusLower = item.status?.toLowerCase();

                    return (
                      <TableRow key={item.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          #{item.id}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{empName}</span>
                            {emp && <span className="text-xs text-muted-foreground">{emp.email}</span>}
                          </div>
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {item.date ? new Date(item.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }) : "-"}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {item.checkInTime ? (
                            <span className="flex items-center gap-1 text-emerald-600 font-medium">
                              <LogIn className="size-3.5" />
                              {new Date(item.checkInTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">--:--</span>
                          )}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {item.checkOutTime ? (
                            <span className="flex items-center gap-1 text-rose-600 font-medium">
                              <LogOut className="size-3.5" />
                              {new Date(item.checkOutTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">--:--</span>
                          )}
                        </TableCell>
                        <TableCell className="tabular-nums font-medium">
                          {calculateDuration(item.checkInTime, item.checkOutTime)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              statusLower === "present"
                                ? "default"
                                : statusLower === "late"
                                  ? "secondary"
                                  : "outline"
                            }
                            className={`capitalize ${statusLower === "present"
                                ? "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400"
                                : statusLower === "late"
                                  ? "bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400"
                                  : "bg-rose-500/10 text-rose-700 border-rose-200 dark:text-rose-400"
                              }`}
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-4">
            <div className="text-xs text-muted-foreground">
              Showing {filteredRecords.length > 0 ? (page - 1) * limit + 1 : 0} to{" "}
              {Math.min(page * limit, filteredRecords.length)} of {filteredRecords.length} records
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="gap-1"
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <span className="text-xs font-medium px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="gap-1"
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
