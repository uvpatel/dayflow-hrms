"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  CalendarCheck,
  Clock,
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

interface AttendanceRecord {
  id: number;
  userId: string;
  date: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export default function AttendancePage() {
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Record<string, Employee>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Active user check-in state (user "1" as current session default)
  const currentUserId = "1";
  const [userCheckIn, setUserCheckIn] = useState<AttendanceRecord | null>(null);

  // Manual entry modal form state
  const [manualUserId, setManualUserId] = useState("1");
  const [manualDate, setManualDate] = useState(new Date().toISOString().split("T")[0]);
  const [manualCheckIn, setManualCheckIn] = useState("09:00");
  const [manualCheckOut, setManualCheckOut] = useState("18:00");
  const [manualStatus, setManualStatus] = useState("present");
  const [isManualOpen, setIsManualOpen] = useState(false);

  // Real-time clock update
  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Attendance & Employees
  const fetchData = async () => {
    try {
      setLoading(true);
      const [attRes, empRes, checkInRes] = await Promise.all([
        fetch(`/api/v1/attendence?limit=50`),
        fetch(`/api/v1/employees?limit=50`),
        fetch(`/api/v1/attendence/check-in?userId=${currentUserId}`),
      ]);

      if (attRes.ok) {
        const attJson = await attRes.json();
        if (attJson.success) {
          setAttendances(attJson.data || []);
        }
      }

      if (empRes.ok) {
        const empJson = await empRes.json();
        if (empJson.success && Array.isArray(empJson.data)) {
          const empMap: Record<string, Employee> = {};
          empJson.data.forEach((emp: Employee) => {
            empMap[emp.id.toString()] = emp;
          });
          setEmployees(empMap);
        }
      }

      if (checkInRes.ok) {
        const checkInJson = await checkInRes.json();
        if (checkInJson.success) {
          setUserCheckIn(checkInJson.data);
        }
      }
    } catch (error) {
      console.error("Failed to load attendance:", error);
      toast.error("Failed to fetch attendance records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Punch In
  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/v1/attendence/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Checked in successfully!");
        setUserCheckIn(data.data);
        fetchData();
      } else {
        toast.error(data.error || "Failed to check in");
      }
    } catch (err) {
      console.error("Check-in error:", err);
      toast.error("An error occurred during check-in");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Punch Out
  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/v1/attendence/check-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Checked out successfully!");
        setUserCheckIn(data.data);
        fetchData();
      } else {
        toast.error(data.error || "Failed to check out");
      }
    } catch (err) {
      console.error("Check-out error:", err);
      toast.error("An error occurred during check-out");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Manual Entry
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const checkInDateTime = new Date(`${manualDate}T${manualCheckIn}:00`);
      const checkOutDateTime = manualCheckOut
        ? new Date(`${manualDate}T${manualCheckOut}:00`)
        : null;

      const res = await fetch("/api/v1/attendence", {
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
        fetchData();
      } else {
        toast.error(data.error || "Failed to save entry");
      }
    } catch (err) {
      console.error("Manual entry error:", err);
      toast.error("Failed to submit manual attendance");
    } finally {
      setActionLoading(false);
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

  const isCheckedIn = Boolean(userCheckIn?.checkInTime && !userCheckIn?.checkOutTime);

  // Calculate duration helper
  const calculateDuration = (inTime?: string | null, outTime?: string | null) => {
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
            onClick={fetchData}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Drawer open={isManualOpen} onOpenChange={setIsManualOpen}>
            <DrawerTrigger >
              <Button size="sm" className="gap-1.5">
                <Plus className="size-4" />
                Add Record
              </Button>
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
                      placeholder="e.g. 1"
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
                        <SelectItem value="half-day">Half Day</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="leave">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DrawerFooter className="max-w-md mx-auto w-full">
                  <Button type="submit" disabled={actionLoading}>
                    {actionLoading ? "Saving..." : "Save Entry"}
                  </Button>
                  <DrawerClose >
                    <Button variant="outline">Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </form>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      {/* Live Punch Clock Widget & Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Punch Clock Card */}
        <Card className="border-primary/20 bg-linear-to-br from-primary/5 via-card to-card">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Punch Clock</span>
              <Badge variant={isCheckedIn ? "default" : "outline"} className="gap-1">
                {isCheckedIn ? (
                  <>
                    <span className="size-2 rounded-full bg-green-500 animate-ping" />
                    Punched In
                  </>
                ) : (
                  "Punched Out"
                )}
              </Badge>
            </CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              {currentTime ? currentTime.toLocaleTimeString() : "--:--:--"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex gap-2">
              {!isCheckedIn ? (
                <Button
                  onClick={handleCheckIn}
                  disabled={actionLoading}
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  <LogIn className="size-4" />
                  Check In
                </Button>
              ) : (
                <Button
                  onClick={handleCheckOut}
                  disabled={actionLoading}
                  variant="destructive"
                  className="w-full gap-2 shadow-sm"
                >
                  <LogOut className="size-4" />
                  Check Out
                </Button>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {isCheckedIn && userCheckIn?.checkInTime
                ? `Logged in at ${new Date(userCheckIn.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : "Record your daily work shift with one click"}
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
              Approved time off & absences
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Logs Table Card */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Attendance Logs</CardTitle>
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
              onValueChange={(val:any) => {
                setStatusFilter(val);
                setPage(1);
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
                <SelectItem value="half-day">Half Day</SelectItem>
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <RefreshCw className="size-6 animate-spin text-primary" />
                        <span>Loading attendance records...</span>
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
                          {new Date(item.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
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
                            className={`capitalize ${
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
