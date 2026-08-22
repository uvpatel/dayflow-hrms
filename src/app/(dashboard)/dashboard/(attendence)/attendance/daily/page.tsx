"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  CalendarDays,
  LogIn,
  LogOut,
  Search,
  Filter,
  RefreshCw,
  Clock,
  UserCheck,
  CalendarCheck,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
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
import { Skeleton } from "@/components/ui/skeleton";

import { useAttendance } from "@/hooks/use-attendance";
import { useEmployees } from "@/hooks/use-employees";
import { useDepartments } from "@/hooks/use-organization";

function calculateDuration(
  inTime?: string | Date | null,
  outTime?: string | Date | null
) {
  if (!inTime) return "—";
  const start = new Date(inTime).getTime();
  if (!outTime) return "In Progress";
  const end = new Date(outTime).getTime();
  const diffHours = (end - start) / (1000 * 60 * 60);
  if (diffHours < 0) return "0h 00m";
  const hours = Math.floor(diffHours);
  const minutes = Math.floor((diffHours - hours) * 60);
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

export default function AttendanceDailyPage() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");

  const {
    data: attendanceData,
    isLoading: attendanceLoading,
    refetch: refetchAttendance,
    isFetching: attendanceFetching,
  } = useAttendance({ limit: 200, date: selectedDate });

  const { data: employeesData } = useEmployees({ limit: 200 });
  const { data: departments = [] } = useDepartments();

  const attendances = useMemo(
    () => attendanceData?.items ?? [],
    [attendanceData]
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

  const departmentMap = useMemo(() => {
    const map = new Map<number, string>();
    departments.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [departments]);

  const handleRefresh = () => {
    refetchAttendance();
    toast.success("Daily attendance data refreshed");
  };

  const handlePreviousDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const handleSetToday = () => {
    setSelectedDate(new Date().toISOString().split("T")[0]);
  };

  // Filter records
  const filteredRecords = useMemo(() => {
    return attendances.filter((record) => {
      const emp = employeeMap.get(record.userId);
      const fullName = emp ? `${emp.firstName} ${emp.lastName}`.toLowerCase() : "";
      const matchesSearch =
        !searchQuery ||
        record.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fullName.includes(searchQuery.toLowerCase()) ||
        (emp && emp.email.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" ||
        record.status?.toLowerCase() === statusFilter.toLowerCase();

      const matchesDept =
        deptFilter === "all" ||
        (emp && emp.departmentId?.toString() === deptFilter);

      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [attendances, employeeMap, searchQuery, statusFilter, deptFilter]);

  // Metrics for selected date
  const presentCount = attendances.filter(
    (a) => a.status?.toLowerCase() === "present"
  ).length;

  const lateCount = attendances.filter(
    (a) => a.status?.toLowerCase() === "late"
  ).length;

  const halfDayCount = attendances.filter(
    (a) => a.status?.toLowerCase() === "half_day"
  ).length;

  const leaveCount = attendances.filter(
    (a) =>
      a.status?.toLowerCase() === "leave" ||
      a.status?.toLowerCase() === "absent"
  ).length;

  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  const formattedSelectedDate = new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="size-7 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Daily Attendance Logs
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Detailed shift logs, punch timestamps, and punctuality breakdown for any calendar day.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
            <span>Refresh</span>
          </Button>

          <Button
            render={<Link href="/dashboard/attendance/weekly" />}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
          >
            <span>Weekly View</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Date Navigation & Selector Toolbar */}
      <Card className="border-border/60 shadow-2xs">
        <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousDay}
              className="size-8"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSetToday}
              className="text-xs"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextDay}
              className="size-8"
            >
              <ChevronRight className="size-4" />
            </Button>

            <div className="ml-2 flex items-center gap-2">
              <CalendarIcon className="size-4 text-primary" />
              <span className="text-sm font-semibold">
                {formattedSelectedDate}
              </span>
              {isToday && (
                <Badge variant="default" className="text-[10px] uppercase">
                  Today
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="datePicker" className="text-xs text-muted-foreground whitespace-nowrap">
              Jump to Date:
            </Label>
            <Input
              id="datePicker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-8 text-xs w-36"
            />
          </div>
        </CardContent>
      </Card>

      {/* Day Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-emerald-500/20 bg-linear-to-br from-emerald-500/5 via-card to-card">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
              <span>Present on Shift</span>
              <UserCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {attendanceLoading ? <Skeleton className="h-9 w-14" /> : presentCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Punched in on schedule
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-linear-to-br from-amber-500/5 via-card to-card">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
              <span>Late Arrivals</span>
              <Clock className="size-4 text-amber-600 dark:text-amber-400" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
              {attendanceLoading ? <Skeleton className="h-9 w-14" /> : lateCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Checked in after grace period
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-linear-to-br from-blue-500/5 via-card to-card">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
              <span>Half Day</span>
              <CalendarDays className="size-4 text-blue-600 dark:text-blue-400" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
              {attendanceLoading ? <Skeleton className="h-9 w-14" /> : halfDayCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Half day work shifts
          </CardContent>
        </Card>

        <Card className="border-rose-500/20 bg-linear-to-br from-rose-500/5 via-card to-card">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
              <span>On Leave / Absent</span>
              <CalendarCheck className="size-4 text-rose-600 dark:text-rose-400" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums text-rose-600 dark:text-rose-400">
              {attendanceLoading ? <Skeleton className="h-9 w-14" /> : leaveCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Authorized leave or absences
          </CardContent>
        </Card>
      </div>

      {/* Daily Logs Table Card */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <CardTitle className="text-base font-semibold">
              Daily Attendance Records ({filteredRecords.length})
            </CardTitle>
            <CardDescription>
              Punch records logged for {formattedSelectedDate}.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search employee, email, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>

            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val ?? "all")}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <Filter className="size-3 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="half_day">Half Day</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="leave">On Leave</SelectItem>
              </SelectContent>
            </Select>

            <Select value={deptFilter} onValueChange={(val) => setDeptFilter(val ?? "all")}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id.toString()}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>First Check In</TableHead>
                <TableHead>Last Check Out</TableHead>
                <TableHead>Hours Logged</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="py-4">
                      <Skeleton className="h-7 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No attendance records logged for {formattedSelectedDate}.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((item) => {
                  const emp = employeeMap.get(item.userId);
                  const empName = emp ? `${emp.firstName} ${emp.lastName}` : `User #${item.userId}`;
                  const deptName = emp?.departmentId
                    ? departmentMap.get(emp.departmentId) || `Dept #${emp.departmentId}`
                    : "General";

                  const statusLower = item.status?.toLowerCase();

                  return (
                    <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="font-medium text-sm text-foreground">{empName}</div>
                        <div className="text-xs text-muted-foreground">
                          {emp?.email || item.userId}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-normal">
                          {deptName}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums text-sm">
                        {item.checkInTime ? (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <LogIn className="size-3.5" />
                            {new Date(item.checkInTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="tabular-nums text-sm">
                        {item.checkOutTime ? (
                          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                            <LogOut className="size-3.5" />
                            {new Date(item.checkOutTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="tabular-nums font-semibold text-sm">
                        {calculateDuration(item.checkInTime, item.checkOutTime)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            statusLower === "present"
                              ? "default"
                              : statusLower === "late"
                              ? "secondary"
                              : "outline"
                          }
                          className={`capitalize text-xs ${
                            statusLower === "present"
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
        </CardContent>
      </Card>
    </div>
  );
}
