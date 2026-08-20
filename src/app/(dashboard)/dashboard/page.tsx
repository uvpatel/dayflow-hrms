"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Users,
  UserCheck,
  CalendarCheck,
  Building2,
  CalendarClock,
  Clock,
  LogIn,
  LogOut,
  TrendingUp,
  ArrowUpRight,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Sparkles,
  Search,
  ChevronRight,
  Plane,
} from "lucide-react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from "recharts";

import { SiteHeader } from "@/components/main/site-header";
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

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  createdAt?: string;
}

interface AttendanceRecord {
  id: number;
  userId: string;
  date: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  status: string;
}

interface LeaveRequest {
  id: number;
  employeeId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
  status: string;
}

interface Department {
  id: number;
  name: string;
  description?: string | null;
}

interface Holiday {
  id: number;
  name: string;
  holidayDate: string;
  description?: string | null;
}

export default function DashboardPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Active Punch state (user "1")
  const currentUserId = "1";
  const [userPunch, setUserPunch] = useState<AttendanceRecord | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Real-time Clock
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all live dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [empRes, attRes, leaveRes, deptRes, holRes, punchRes] =
        await Promise.all([
          fetch("/api/v1/employees?limit=50"),
          fetch("/api/v1/attendence?limit=50"),
          fetch("/api/v1/leave-requests?limit=50"),
          fetch("/api/v1/departments"),
          fetch("/api/v1/holidays"),
          fetch(`/api/v1/attendence/check-in?userId=${currentUserId}`),
        ]);

      if (empRes.ok) {
        const json = await empRes.json();
        if (json.success && Array.isArray(json.data)) setEmployees(json.data);
      }

      if (attRes.ok) {
        const json = await attRes.json();
        if (json.success && Array.isArray(json.data)) setAttendances(json.data);
      }

      if (leaveRes.ok) {
        const json = await leaveRes.json();
        if (json.success && Array.isArray(json.data)) setLeaveRequests(json.data);
      }

      if (deptRes.ok) {
        const json = await deptRes.json();
        if (json.success && Array.isArray(json.data)) setDepartments(json.data);
      }

      if (holRes.ok) {
        const json = await holRes.json();
        if (json.success && Array.isArray(json.data)) setHolidays(json.data);
      }

      if (punchRes.ok) {
        const json = await punchRes.json();
        if (json.success) setUserPunch(json.data);
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
      toast.error("Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
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
        setUserPunch(data.data);
        loadDashboardData();
      } else {
        toast.error(data.error || "Failed to check in");
      }
    } catch (err) {
      toast.error("Error connecting to check-in service");
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
        setUserPunch(data.data);
        loadDashboardData();
      } else {
        toast.error(data.error || "Failed to check out");
      }
    } catch (err) {
      toast.error("Error connecting to check-out service");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Approve Leave
  const handleApproveLeave = async (id: number) => {
    try {
      const res = await fetch(`/api/v1/leave-requests/${id}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Leave request #${id} approved`);
        loadDashboardData();
      } else {
        toast.error(data.error || "Failed to approve request");
      }
    } catch (err) {
      toast.error("Error processing approval");
    }
  };

  // Handle Reject Leave
  const handleRejectLeave = async (id: number) => {
    try {
      const res = await fetch(`/api/v1/leave-requests/${id}/reject`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Leave request #${id} rejected`);
        loadDashboardData();
      } else {
        toast.error(data.error || "Failed to reject request");
      }
    } catch (err) {
      toast.error("Error processing rejection");
    }
  };

  // Map employee map for quick lookup
  const employeeMap = useMemo(() => {
    const map: Record<number, Employee> = {};
    employees.forEach((emp) => {
      map[emp.id] = emp;
    });
    return map;
  }, [employees]);

  // Derived Analytics Metrics
  const totalEmployees = employees.length;
  const presentToday = attendances.filter(
    (a) => a.status?.toLowerCase() === "present"
  ).length;
  const attendanceRate =
    totalEmployees > 0
      ? Math.min(100, Math.round((presentToday / totalEmployees) * 100))
      : 85;

  const pendingLeaves = leaveRequests.filter(
    (l) => l.status?.toLowerCase() === "pending"
  ).length;

  const isCheckedIn = Boolean(userPunch?.checkInTime && !userPunch?.checkOutTime);

  // Weekly Trend Chart Data
  const chartData = [
    { day: "Mon", present: 42, late: 3, absent: 2 },
    { day: "Tue", present: 45, late: 2, absent: 1 },
    { day: "Wed", present: 44, late: 4, absent: 0 },
    { day: "Thu", present: 46, late: 1, absent: 1 },
    { day: "Fri", present: Math.max(presentToday, 40), late: 5, absent: 3 },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader title="HRMS Overview" />

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
        {/* Welcome & Live Punch Action Banner */}
        <div className="flex flex-col gap-4 rounded-2xl bg-linear-to-r from-primary/10 via-primary/5 to-card p-6 border border-primary/20 sm:flex-row sm:items-center sm:justify-between shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Dayflow HR Workspace
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Welcome back, Urvil
            </h2>
            <p className="text-sm text-muted-foreground">
              {currentTime
                ? currentTime.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Loading date..."}{" "}
              • Real-time workforce operations & attendance.
            </p>
          </div>

          {/* Quick Punch Clock */}
          <div className="flex items-center gap-3 bg-card/80 backdrop-blur-sm p-3 rounded-xl border shadow-xs">
            <div className="text-right">
              <div className="text-xs font-medium text-muted-foreground">Current Time</div>
              <div className="font-mono text-lg font-bold tabular-nums">
                {currentTime ? currentTime.toLocaleTimeString() : "--:--:--"}
              </div>
            </div>
            <div className="h-8 w-px bg-border" />
            {!isCheckedIn ? (
              <Button
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                <LogIn className="size-4" />
                Check In
              </Button>
            ) : (
              <Button
                onClick={handleCheckOut}
                disabled={actionLoading}
                variant="destructive"
                className="gap-2 shadow-sm"
              >
                <LogOut className="size-4" />
                Check Out
              </Button>
            )}
          </div>
        </div>

        {/* Executive KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Total Employees</CardDescription>
              <Users className="size-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalEmployees || 48}</div>
              <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                <Building2 className="size-3.5" />
                <span>Across {departments.length || 6} departments</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Today's Attendance</CardDescription>
              <UserCheck className="size-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{attendanceRate}%</div>
              <div className="flex items-center gap-1.5 pt-1 text-xs text-emerald-600 font-medium">
                <TrendingUp className="size-3.5" />
                <span>{presentToday || 42} employees present today</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Pending Leaves</CardDescription>
              <CalendarClock className="size-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingLeaves}</div>
              <div className="flex items-center gap-1.5 pt-1 text-xs text-amber-600 font-medium">
                <AlertCircle className="size-3.5" />
                <span>Requires manager approval</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Upcoming Holidays</CardDescription>
              <Calendar className="size-5 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{holidays.length || 3}</div>
              <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                <Plane className="size-3.5" />
                <span>Next: Diwali & New Year</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visual Charts Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Weekly Attendance Trend Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Attendance Trends</CardTitle>
                  <CardDescription>Weekly workforce presence and punctuality</CardDescription>
                </div>
                <Badge variant="outline" className="gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Live Sync
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="lateGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        backgroundColor: "var(--background)",
                        borderColor: "var(--border)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="present"
                      name="Present"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#presentGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="late"
                      name="Late"
                      stroke="#f59e0b"
                      fillOpacity={1}
                      fill="url(#lateGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quick Department Distribution / Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Departments</CardTitle>
              <CardDescription>Organization team structures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(departments.length > 0 ? departments : [
                  { id: 1, name: "Engineering", description: "Product & Tech" },
                  { id: 2, name: "Human Resources", description: "People & Culture" },
                  { id: 3, name: "Sales & Marketing", description: "Revenue Growth" },
                  { id: 4, name: "Design & UX", description: "Design Systems" },
                ]).slice(0, 4).map((dept) => (
                  <div
                    key={dept.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary font-bold text-xs">
                        {dept.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{dept.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {dept.description || "Active Unit"}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Active
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live HR Operations Hub Tabs */}
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>HR Operations Hub</CardTitle>
              <CardDescription>
                Direct access to live employee attendance, pending leave approvals, and holidays.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadDashboardData}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              Sync Data
            </Button>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="attendance" className="w-full space-y-4">
              <TabsList className="grid w-full grid-cols-4 max-w-md">
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="leaves">
                  Leaves
                  {pendingLeaves > 0 && (
                    <Badge variant="destructive" className="ml-1.5 size-4 p-0 flex items-center justify-center rounded-full text-[10px]">
                      {pendingLeaves}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="directory">Directory</TabsTrigger>
                <TabsTrigger value="holidays">Holidays</TabsTrigger>
              </TabsList>

              {/* Attendance Tab */}
              <TabsContent value="attendance" className="space-y-4">
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Check In</TableHead>
                        <TableHead>Check Out</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendances.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                            No attendance records recorded yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        attendances.slice(0, 5).map((att) => {
                          const emp = employeeMap[Number(att.userId)];
                          const empName = emp ? `${emp.firstName} ${emp.lastName}` : `User #${att.userId}`;
                          return (
                            <TableRow key={att.id} className="hover:bg-muted/30">
                              <TableCell className="font-medium">{empName}</TableCell>
                              <TableCell>
                                {new Date(att.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="tabular-nums">
                                {att.checkInTime
                                  ? new Date(att.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                  : "--:--"}
                              </TableCell>
                              <TableCell className="tabular-nums">
                                {att.checkOutTime
                                  ? new Date(att.checkOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                  : "--:--"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="capitalize bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400"
                                >
                                  {att.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Leaves Tab */}
              <TabsContent value="leaves" className="space-y-4">
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaveRequests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                            No leave requests pending.
                          </TableCell>
                        </TableRow>
                      ) : (
                        leaveRequests.slice(0, 5).map((req) => {
                          const emp = employeeMap[req.employeeId];
                          const empName = emp ? `${emp.firstName} ${emp.lastName}` : `Employee #${req.employeeId}`;
                          const isPending = req.status?.toLowerCase() === "pending";

                          return (
                            <TableRow key={req.id}>
                              <TableCell className="font-medium">{empName}</TableCell>
                              <TableCell className="capitalize">{req.leaveType}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={isPending ? "secondary" : req.status === "approved" ? "default" : "destructive"}
                                  className="capitalize"
                                >
                                  {req.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {isPending ? (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs text-emerald-600 hover:bg-emerald-50"
                                      onClick={() => handleApproveLeave(req.id)}
                                    >
                                      <CheckCircle2 className="size-3.5 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs text-rose-600 hover:bg-rose-50"
                                      onClick={() => handleRejectLeave(req.id)}
                                    >
                                      <XCircle className="size-3.5 mr-1" />
                                      Reject
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Processed</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Directory Tab */}
              <TabsContent value="directory" className="space-y-4">
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            No employee records found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        employees.slice(0, 5).map((emp) => (
                          <TableRow key={emp.id}>
                            <TableCell className="font-medium">
                              {emp.firstName} {emp.lastName}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {emp.email}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {emp.phoneNumber || "-"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : "Active"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Holidays Tab */}
              <TabsContent value="holidays" className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {(holidays.length > 0 ? holidays : [
                    { id: 1, name: "New Year's Day", holidayDate: "2026-01-01", description: "Public Holiday" },
                    { id: 2, name: "Independence Day", holidayDate: "2026-08-15", description: "National Holiday" },
                    { id: 3, name: "Diwali Festival", holidayDate: "2026-11-08", description: "Festival of Lights" },
                  ]).map((h) => (
                    <div
                      key={h.id}
                      className="p-4 rounded-xl border bg-card hover:border-primary/40 transition-colors space-y-1"
                    >
                      <div className="text-xs font-semibold text-primary">
                        {new Date(h.holidayDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className="font-bold text-foreground">{h.name}</div>
                      <div className="text-xs text-muted-foreground">{h.description || "Company Holiday"}</div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
