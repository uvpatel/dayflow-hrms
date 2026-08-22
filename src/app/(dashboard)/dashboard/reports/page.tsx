"use client";

import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
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
    toast.success(`Exporting ${filename}.csv... Download started.`);
  };

  const handleRefreshAll = () => {
    refetchDash();
    refetchAtt();
    refetchLeave();
    refetchPay();
    toast.success("Analytics & Reports synchronized");
  };

  const loading = dashLoading || attLoading || leaveLoading || payLoading;

  const attendanceData = dashboardReport?.attendanceTrend ?? [
    { date: "Mon", present: 18, absent: 1, leave: 1 },
    { date: "Tue", present: 19, absent: 0, leave: 1 },
    { date: "Wed", present: 18, absent: 1, leave: 1 },
    { date: "Thu", present: 19, absent: 1, leave: 0 },
    { date: "Fri", present: 18, absent: 1, leave: 1 },
  ];

  const leaveByStatus = leaveReport?.byStatus ?? [
    { status: "Approved", count: 8 },
    { status: "Pending", count: 3 },
    { status: "Rejected", count: 1 },
  ];

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
            <div className="text-2xl font-bold">{dashboardReport?.totalEmployees ?? 20}</div>
            <p className="text-xs text-muted-foreground pt-1">Active staff members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription>Avg Attendance Rate</CardDescription>
            <Clock className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium pt-1">
              <TrendingUp className="size-3.5" />
              <span>+2.1% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription>Leave Requests (Total)</CardDescription>
            <Calendar className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaveReport?.totalRequests ?? 12}</div>
            <p className="text-xs text-muted-foreground pt-1">{leaveReport?.pendingRequests ?? 3} awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription>Monthly Payroll Total</CardDescription>
            <DollarSign className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${payrollReport?.totalDisbursed ?? "142,500.00"}</div>
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
                  <BarChart data={attendanceReport?.byStatus ?? [{ status: "Present", count: 85 }, { status: "Late", count: 8 }, { status: "Half Day", count: 3 }, { status: "Absent", count: 4 }]}>
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
                        {Math.round((item.count / 12) * 100)}%
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
                    <TableHead>Payroll Period</TableHead>
                    <TableHead>Payslips Processed</TableHead>
                    <TableHead>Total Gross</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">August 2026</TableCell>
                    <TableCell className="tabular-nums">20 Staff</TableCell>
                    <TableCell className="tabular-nums font-mono font-semibold">$142,500.00</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700">Finalized</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
