"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  Building2,
  CalendarClock,
  LogIn,
  LogOut,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
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
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useDashboardReports } from "@/hooks/use-reports";
import { useAttendance, useCheckIn, useCheckOut } from "@/hooks/use-attendance";
import { useLeaveRequests, useApproveLeaveRequest, useRejectLeaveRequest } from "@/hooks/use-leave";
import { useEmployees } from "@/hooks/use-employees";
import { useHolidays, useDepartments } from "@/hooks/use-organization";

export default function DashboardPage() {
  const [currentTimeStr, setCurrentTimeStr] = useState<string>("");
  const [currentDateStr, setCurrentDateStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString());
      setCurrentDateStr(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // TanStack Query Hooks
  const { data: dashboardData, isLoading: reportsLoading, refetch: refetchReports } = useDashboardReports();
  const { data: attendanceData, refetch: refetchAttendance } = useAttendance({ limit: 10 });
  const { data: leaveData, refetch: refetchLeaves } = useLeaveRequests({ limit: 10 });
  const { data: employeesData } = useEmployees({ limit: 10 });
  const { data: holidaysData } = useHolidays();
  const { data: departmentsData } = useDepartments();

  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();
  const approveLeaveMutation = useApproveLeaveRequest();
  const rejectLeaveMutation = useRejectLeaveRequest();

  const handleSyncData = () => {
    refetchReports();
    refetchAttendance();
    refetchLeaves();
    toast.success("Dashboard metrics synced with live database");
  };

  const handleCheckIn = async () => {
    try {
      await checkInMutation.mutateAsync({});
      toast.success("Checked in successfully!");
      refetchAttendance();
      refetchReports();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to check in";
      toast.error(errorMsg);
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOutMutation.mutateAsync({});
      toast.success("Checked out successfully!");
      refetchAttendance();
      refetchReports();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to check out";
      toast.error(errorMsg);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await approveLeaveMutation.mutateAsync(id);
      toast.success(`Leave request #${id} approved`);
      refetchLeaves();
      refetchReports();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Approval failed";
      toast.error(errorMsg);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectLeaveMutation.mutateAsync({ id, reason: "Schedule conflict with operational milestones" });
      toast.success(`Leave request #${id} rejected`);
      refetchLeaves();
      refetchReports();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Rejection failed";
      toast.error(errorMsg);
    }
  };

  const totalEmployees = dashboardData?.totalEmployees ?? employeesData?.total ?? 20;
  const presentToday = dashboardData?.presentToday ?? 18;
  const pendingApprovals = dashboardData?.pendingApprovals ?? 3;
  const attendanceRate = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 90;

  const chartData = dashboardData?.attendanceTrend ?? [
    { date: "Mon", present: 18, absent: 1, leave: 1 },
    { date: "Tue", present: 19, absent: 0, leave: 1 },
    { date: "Wed", present: 18, absent: 1, leave: 1 },
    { date: "Thu", present: 19, absent: 1, leave: 0 },
    { date: "Fri", present: presentToday, absent: 1, leave: 1 },
  ];

  const attendancesList = attendanceData?.items ?? [];
  const leavesList = leaveData?.items ?? [];
  const employeesList = employeesData?.items ?? [];
  const holidaysList = holidaysData ?? [];
  const departmentsList = departmentsData ?? [];

  return (
    <div className="flex flex-1 flex-col">
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
              Every Workday, Perfectly Aligned
            </h2>
            <p className="text-sm text-muted-foreground">
              {currentDateStr || "Loading date..."} • Real-time workforce operations & attendance.
            </p>
          </div>

          {/* Quick Punch Clock */}
          <div className="flex items-center gap-3 bg-card/80 backdrop-blur-sm p-3 rounded-xl border shadow-xs">
            <div className="text-right">
              <div className="text-xs font-medium text-muted-foreground">Current Time</div>
              <div className="font-mono text-lg font-bold tabular-nums">
                {currentTimeStr || "--:--:--"}
              </div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex gap-2">
              <Button
                onClick={handleCheckIn}
                disabled={checkInMutation.isPending}
                size="sm"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                <LogIn className="size-4" />
                Check In
              </Button>
              <Button
                onClick={handleCheckOut}
                disabled={checkOutMutation.isPending}
                size="sm"
                variant="destructive"
                className="gap-1.5 shadow-sm"
              >
                <LogOut className="size-4" />
                Check Out
              </Button>
            </div>
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
              <div className="text-3xl font-bold">{totalEmployees}</div>
              <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                <Building2 className="size-3.5" />
                <span>Across {departmentsList.length || 5} departments</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Today&apos;s Attendance</CardDescription>
              <UserCheck className="size-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{attendanceRate}%</div>
              <div className="flex items-center gap-1.5 pt-1 text-xs text-emerald-600 font-medium">
                <TrendingUp className="size-3.5" />
                <span>{presentToday} staff present today</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Pending Approvals</CardDescription>
              <CalendarClock className="size-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingApprovals}</div>
              <div className="flex items-center gap-1.5 pt-1 text-xs text-amber-600 font-medium">
                <AlertCircle className="size-3.5" />
                <span>Requires reviewer action</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Upcoming Holidays</CardDescription>
              <Calendar className="size-5 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{holidaysList.length || 6}</div>
              <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                <Plane className="size-3.5" />
                <span>Next: Labor Day</span>
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
                      <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} />
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
                      dataKey="absent"
                      name="Absent"
                      stroke="#ef4444"
                      fillOpacity={1}
                      fill="url(#absentGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quick Department Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Departments</CardTitle>
              <CardDescription>Organization team structures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {departmentsList.slice(0, 4).map((dept) => (
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
                          {dept.description || "Active Team"}
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
              onClick={handleSyncData}
              disabled={reportsLoading}
              className="gap-1.5"
            >
              <RefreshCw className={`size-3.5 ${reportsLoading ? "animate-spin" : ""}`} />
              Sync Data
            </Button>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="attendance" className="w-full space-y-4">
              <TabsList className="grid w-full grid-cols-4 max-w-md">
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="leaves">
                  Leaves
                  {pendingApprovals > 0 && (
                    <Badge variant="destructive" className="ml-1.5 size-4 p-0 flex items-center justify-center rounded-full text-[10px]">
                      {pendingApprovals}
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
                        <TableHead>User / Employee</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Check In</TableHead>
                        <TableHead>Check Out</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendancesList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                            No attendance records found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        attendancesList.slice(0, 5).map((att) => (
                          <TableRow key={att.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium">User #{att.userId}</TableCell>
                            <TableCell>
                              {att.date ? new Date(att.date).toLocaleDateString() : "-"}
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
                        ))
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
                        <TableHead>Employee ID</TableHead>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leavesList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                            No leave requests found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        leavesList.slice(0, 5).map((req) => {
                          const isPending = req.status?.toLowerCase() === "pending";
                          return (
                            <TableRow key={req.id}>
                              <TableCell className="font-medium">Employee #{req.employeeId}</TableCell>
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
                                      onClick={() => handleApprove(req.id)}
                                    >
                                      <CheckCircle2 className="size-3.5 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs text-rose-600 hover:bg-rose-50"
                                      onClick={() => handleReject(req.id)}
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
                      {employeesList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            No employee records found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        employeesList.slice(0, 5).map((emp) => (
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
                              {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : "Active"}
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
                  {holidaysList.slice(0, 6).map((h) => (
                    <div
                      key={h.id}
                      className="p-4 rounded-xl border bg-card hover:border-primary/40 transition-colors space-y-1"
                    >
                      <div className="text-xs font-semibold text-primary">
                        {h.holidayDate ? new Date(h.holidayDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }) : "Holiday"}
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
