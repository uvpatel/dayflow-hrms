"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  CalendarRange,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { useAttendance } from "@/hooks/use-attendance";
import { useEmployees } from "@/hooks/use-employees";
import { useDepartments } from "@/hooks/use-organization";

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default function AttendanceWeeklyPage() {
  const [currentWeekMonday, setCurrentWeekMonday] = useState<Date>(() =>
    getMonday(new Date())
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  const {
    data: attendanceData,
    isLoading: attendanceLoading,
    refetch: refetchAttendance,
    isFetching: attendanceFetching,
  } = useAttendance({ limit: 500 });

  const { data: employeesData, isLoading: employeesLoading } = useEmployees({
    limit: 200,
  });

  const { data: departments = [] } = useDepartments();

  const attendances = useMemo(
    () => attendanceData?.items ?? [],
    [attendanceData]
  );
  const employees = useMemo(
    () => employeesData?.items ?? [],
    [employeesData]
  );

  const departmentMap = useMemo(() => {
    const map = new Map<number, string>();
    departments.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [departments]);

  // Generate the 7 days of the selected week (Mon -> Sun)
  const weekDays = useMemo(() => {
    const days: { dateStr: string; dayName: string; formatted: string; isWeekend: boolean }[] = [];
    const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekMonday);
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      days.push({
        dateStr: iso,
        dayName: names[i],
        formatted: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        isWeekend: i >= 5,
      });
    }
    return days;
  }, [currentWeekMonday]);

  const handlePrevWeek = () => {
    const d = new Date(currentWeekMonday);
    d.setDate(d.getDate() - 7);
    setCurrentWeekMonday(d);
  };

  const handleNextWeek = () => {
    const d = new Date(currentWeekMonday);
    d.setDate(d.getDate() + 7);
    setCurrentWeekMonday(d);
  };

  const handleThisWeek = () => {
    setCurrentWeekMonday(getMonday(new Date()));
  };

  const handleRefresh = () => {
    refetchAttendance();
    toast.success("Weekly timesheet data refreshed");
  };

  // Build matrix lookup: userId + dateStr -> { hours: number, status: string, checkIn, checkOut }
  const punchMatrix = useMemo(() => {
    const map = new Map<
      string,
      { hours: number; status: string; checkIn?: string | Date | null; checkOut?: string | Date | null }
    >();

    attendances.forEach((record) => {
      if (!record.date) return;
      const dateStr = new Date(record.date).toISOString().split("T")[0];
      const key = `${record.userId}_${dateStr}`;

      let hours = 0;
      if (record.checkInTime) {
        const start = new Date(record.checkInTime).getTime();
        const end = record.checkOutTime
          ? new Date(record.checkOutTime).getTime()
          : start + 8 * 3600 * 1000;
        hours = Math.max(0, (end - start) / (1000 * 3600));
      }

      map.set(key, {
        hours: Number(hours.toFixed(1)),
        status: record.status || "present",
        checkIn: record.checkInTime,
        checkOut: record.checkOutTime,
      });
    });

    return map;
  }, [attendances]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const name = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        name.includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.employeeNumber &&
          emp.employeeNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDept =
        deptFilter === "all" ||
        emp.departmentId?.toString() === deptFilter;

      return matchesSearch && matchesDept;
    });
  }, [employees, searchQuery, deptFilter]);

  // Compute total logged hours across all employees this week
  const { totalWeekHours, avgEmployeeHours } = useMemo(() => {
    let total = 0;
    filteredEmployees.forEach((emp) => {
      weekDays.forEach((day) => {
        const key = `${emp.userId || emp.id}_${day.dateStr}`;
        const record = punchMatrix.get(key);
        if (record) total += record.hours;
      });
    });

    const avg =
      filteredEmployees.length > 0
        ? Number((total / filteredEmployees.length).toFixed(1))
        : 0;

    return {
      totalWeekHours: Number(total.toFixed(1)),
      avgEmployeeHours: avg,
    };
  }, [filteredEmployees, weekDays, punchMatrix]);

  const weekRangeLabel = useMemo(() => {
    const start = weekDays[0]?.formatted;
    const end = weekDays[6]?.formatted;
    const year = currentWeekMonday.getFullYear();
    return `${start} – ${end}, ${year}`;
  }, [weekDays, currentWeekMonday]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarRange className="size-7 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Weekly Timesheet Matrix
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Multi-day timesheet grid, weekly hours accumulation, and shift coverage tracker.
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
            render={<Link href="/dashboard/attendance/daily" />}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
          >
            <span>Daily View</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Week Navigator Card */}
      <Card className="border-border/60 shadow-2xs">
        <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevWeek}
              className="size-8"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleThisWeek}
              className="text-xs"
            >
              This Week
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextWeek}
              className="size-8"
            >
              <ChevronRight className="size-4" />
            </Button>

            <span className="ml-2 text-sm font-semibold tracking-tight">
              {weekRangeLabel}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search team member..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>

            <Select value={deptFilter} onValueChange={(val) => setDeptFilter(val ?? "all")}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <Filter className="size-3 mr-1 text-muted-foreground" />
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
        </CardContent>
      </Card>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-primary/20 bg-linear-to-br from-primary/5 via-card to-card">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
              <span>Total Hours Logged</span>
              <Clock className="size-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums text-primary">
              {attendanceLoading ? <Skeleton className="h-9 w-20" /> : `${totalWeekHours} hrs`}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Cumulative team work time this week
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-linear-to-br from-emerald-500/5 via-card to-card">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
              <span>Average / Employee</span>
              <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {attendanceLoading ? <Skeleton className="h-9 w-20" /> : `${avgEmployeeHours} hrs`}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Target benchmark: 40 hrs / week
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-linear-to-br from-blue-500/5 via-card to-card">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
              <span>Active Workforce</span>
              <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
              {employeesLoading ? <Skeleton className="h-9 w-14" /> : filteredEmployees.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Staff members in current schedule
          </CardContent>
        </Card>
      </div>

      {/* Weekly Timesheet Grid Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold">
                Weekly Grid Timesheet
              </CardTitle>
              <CardDescription>
                Daily shift breakdown across Monday through Sunday.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-emerald-500" /> Present (8h+)
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-amber-500" /> Partial / Late
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-rose-500" /> Absent / Out
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="min-w-[180px]">Employee</TableHead>
                  {weekDays.map((day) => (
                    <TableHead
                      key={day.dateStr}
                      className={`text-center min-w-[85px] ${
                        day.isWeekend ? "bg-muted/60 text-muted-foreground" : ""
                      }`}
                    >
                      <div className="font-semibold text-xs">{day.dayName}</div>
                      <div className="text-[10px] text-muted-foreground font-normal">
                        {day.formatted}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-center min-w-[90px] font-semibold">
                    Total
                  </TableHead>
                  <TableHead className="text-right min-w-[100px]">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeesLoading || attendanceLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={10} className="py-4">
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                      No employees match your search criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((emp) => {
                    let employeeTotalHours = 0;
                    const initials = `${emp.firstName[0] || ""}${emp.lastName[0] || ""}`.toUpperCase();
                    const deptName = emp.departmentId
                      ? departmentMap.get(emp.departmentId)
                      : undefined;

                    return (
                      <TableRow key={emp.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar size="sm" className="size-7">
                              <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-semibold text-xs truncate">
                                {emp.firstName} {emp.lastName}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {deptName || emp.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* 7 Day cells */}
                        {weekDays.map((day) => {
                          const key = `${emp.userId || emp.id}_${day.dateStr}`;
                          const record = punchMatrix.get(key);

                          if (record) {
                            employeeTotalHours += record.hours;
                          }

                          return (
                            <TableCell
                              key={day.dateStr}
                              className={`text-center py-2 px-1 ${
                                day.isWeekend ? "bg-muted/20" : ""
                              }`}
                            >
                              {record ? (
                                <span
                                  className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold tabular-nums ${
                                    record.hours >= 8
                                      ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 dark:text-emerald-400"
                                      : record.hours > 0
                                      ? "bg-amber-500/10 text-amber-700 border border-amber-500/20 dark:text-amber-400"
                                      : "bg-rose-500/10 text-rose-700 border border-rose-500/20 dark:text-rose-400"
                                  }`}
                                  title={`Status: ${record.status}`}
                                >
                                  {record.hours > 0 ? `${record.hours}h` : record.status}
                                </span>
                              ) : day.isWeekend ? (
                                <span className="text-[10px] text-muted-foreground/60 font-mono">
                                  Off
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground/40 font-mono">
                                  —
                                </span>
                              )}
                            </TableCell>
                          );
                        })}

                        {/* Total weekly hours */}
                        <TableCell className="text-center tabular-nums font-bold text-xs text-foreground">
                          {employeeTotalHours.toFixed(1)}h
                        </TableCell>

                        {/* Weekly Target Status Badge */}
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              employeeTotalHours >= 40
                                ? "default"
                                : employeeTotalHours >= 30
                                ? "secondary"
                                : "outline"
                            }
                            className={`text-[10px] font-semibold ${
                              employeeTotalHours >= 40
                                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400"
                                : ""
                            }`}
                          >
                            {employeeTotalHours >= 40
                              ? "Target Met"
                              : employeeTotalHours > 0
                              ? "In Progress"
                              : "No Hours"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
