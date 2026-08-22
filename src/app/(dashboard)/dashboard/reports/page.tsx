"use client";

import React, { useState } from "react";
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  Users,
  Clock,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
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
import {
  useDashboardReports,
  useAttendanceReports,
  useLeaveReports,
  usePayrollReports,
} from "@/hooks/use-reports";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: dashboardReport, isLoading: dashLoading, refetch: refetchDash } = useDashboardReports();
  const { data: attendanceReport, isLoading: attLoading, refetch: refetchAtt } = useAttendanceReports();
  const { data: leaveReport, isLoading: leaveLoading, refetch: refetchLeave } = useLeaveReports();
  const { data: payrollReport, isLoading: payLoading, refetch: refetchPay } = usePayrollReports();

  const handleExportCSV = (filename: string) => {
    const rows = [
      ["Metric", "Value"],
      ["Active workforce", dashboardReport?.totalEmployees ?? 0],
      ["Present today", dashboardReport?.presentToday ?? 0],
      ["Leave requests", leaveReport?.summary.totalRequests ?? 0],
      ["Published payroll total", payrollReport?.summary.totalDisbursed ?? 0],
    ];
    const csv = rows
      .map((row) => row.map((cell) => JSON.stringify(String(cell))).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${filename}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(`${filename}.csv downloaded`);
  };

  const handleRefreshAll = () => {
    refetchDash();
    refetchAtt();
    refetchLeave();
    refetchPay();
    toast.success("Analytics & Reports synchronized");
  };

  const loading = dashLoading || attLoading || leaveLoading || payLoading;

  const attendanceData = dashboardReport?.attendanceTrend ?? [];

  const leaveByStatus = leaveReport ? [
    { status: "Approved", count: leaveReport.summary.approved },
    { status: "Pending", count: leaveReport.summary.pending },
    { status: "Rejected", count: leaveReport.summary.rejected },
  ] : [];
  const recordedAttendance = attendanceReport?.dailyBreakdown.reduce(
    (total, day) => total + day.present + day.absent,
    0,
  ) ?? 0;
  const recordedPresent = attendanceReport?.dailyBreakdown.reduce(
    (total, day) => total + day.present,
    0,
  ) ?? 0;
  const attendanceRate = recordedAttendance > 0
    ? (recordedPresent / recordedAttendance) * 100
    : 0;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
            <BarChart3 className="size-7 text-primary" />
            Analytics &amp; Executive Reports
          </h1>
          <p className="text-sm text-muted-foreground">
            Workforce intelligence, attendance compliance, time-off utilization, and payroll disbursement audit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefreshAll} disabled={loading} className="gap-1.5">
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => handleExportCSV("hrms_executive_summary")} className="gap-1.5 bg-primary text-primary-foreground">
            <Download className="size-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription>Total Workforce</CardDescription>
            <Users className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardReport?.totalEmployees ?? 0}</div>
            <p className="text-xs text-muted-foreground pt-1">Active staff members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription>Avg Attendance Rate</CardDescription>
            <Clock className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate.toFixed(1)}%</div>
            <p className="pt-1 text-xs text-muted-foreground">Based on recorded attendance rows</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription>Leave Requests (Total)</CardDescription>
            <Calendar className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaveReport?.summary.totalRequests ?? 0}</div>
            <p className="text-xs text-muted-foreground pt-1">{leaveReport?.summary.pending ?? 0} awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription>Monthly Payroll Total</CardDescription>
            <DollarSign className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(payrollReport?.summary.totalDisbursed ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground pt-1">Total compensation disbursed</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full sm:w-auto grid-cols-4">
          <TabsTrigger value="overview">Executive Trend</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leave">Time Off</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>

        {/* Executive Trend Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workforce Presence &amp; Shift Compliance</CardTitle>
              <CardDescription>Daily present vs absent trends across all departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
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
                      fill="url(#colorPresent)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Breakdown Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Distribution</CardTitle>
              <CardDescription>Breakdown by status categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceReport ? [
                    { status: "On time", count: attendanceReport.summary.onTime },
                    { status: "Late", count: attendanceReport.summary.late },
                    { status: "Half day", count: attendanceReport.summary.halfDay },
                  ] : []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="status" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        backgroundColor: "var(--background)",
                        borderColor: "var(--border)",
                      }}
                    />
                    <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Report Tab */}
        <TabsContent value="leave" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leave Requests by Status</CardTitle>
              <CardDescription>Approval breakdown and current queue distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveByStatus.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        <Badge
                          variant={
                            item.status.toLowerCase() === "approved"
                              ? "default"
                              : item.status.toLowerCase() === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                          className="capitalize"
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums font-semibold">{item.count}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {leaveReport && leaveReport.summary.totalRequests > 0
                          ? Math.round((item.count / leaveReport.summary.totalRequests) * 100)
                          : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payroll Report Tab */}
        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Cycle Audit &amp; Disbursements</CardTitle>
              <CardDescription>Summary of processed payroll periods</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Total published net pay</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(payrollReport?.costByDepartment ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        No published payroll data is available.
                      </TableCell>
                    </TableRow>
                  ) : payrollReport?.costByDepartment.map((entry) => (
                    <TableRow key={entry.department}>
                      <TableCell className="font-medium">{entry.department}</TableCell>
                      <TableCell className="tabular-nums font-mono font-semibold">
                        ${entry.totalPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
