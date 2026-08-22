"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Wallet,
  Building2,
  Search,
  Filter,
  RefreshCw,
  ArrowRight,
  UserPlus,
  Calculator,
  CalendarCheck,
  Check,
  Briefcase,
  Layers,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { PortalHeader } from "../_components/portal-header";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { useEmployees } from "@/hooks/use-employees";
import {
  useLeaveRequests,
  useApproveLeaveRequest,
  useRejectLeaveRequest,
} from "@/hooks/use-leave";
import { useAttendanceCorrections } from "@/hooks/use-attendance";
import {
  usePayrollPeriods,
  useCalculatePayroll,
  useFinalizePayroll,
} from "@/hooks/use-payroll";
import { useDepartments, useHolidays } from "@/hooks/use-organization";
import { useDashboardReports } from "@/hooks/use-reports";

interface HRDashboardClientProps {
  userRole: "admin" | "hr" | "manager" | "employee";
}

export function HRDashboardClient({ userRole }: HRDashboardClientProps) {
  const [activeTab, setActiveTab] = useState("workforce");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Rejection modal state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Data Queries
  const {
    data: employeesData,
    isLoading: employeesLoading,
    refetch: refetchEmployees,
    isFetching: employeesFetching,
  } = useEmployees({ limit: 100 });

  const {
    data: reportsData,
    isLoading: reportsLoading,
    refetch: refetchReports,
  } = useDashboardReports("hr");

  const {
    data: leaveData,
    isLoading: leaveLoading,
    refetch: refetchLeaves,
  } = useLeaveRequests({ limit: 100 });

  const {
    data: correctionsData,
    isLoading: correctionsLoading,
    refetch: refetchCorrections,
  } = useAttendanceCorrections({ limit: 100 });

  const {
    data: payrollData,
    isLoading: payrollLoading,
    refetch: refetchPayroll,
  } = usePayrollPeriods({ limit: 20 });

  const { data: departments = [] } = useDepartments();
  const { data: holidays = [] } = useHolidays();

  // Mutations
  const approveLeave = useApproveLeaveRequest();
  const rejectLeave = useRejectLeaveRequest();
  const calculatePayroll = useCalculatePayroll();
  const finalizePayroll = useFinalizePayroll();

  const isRefreshing =
    employeesFetching || employeesLoading || leaveLoading || reportsLoading;

  const handleRefreshAll = () => {
    refetchEmployees();
    refetchReports();
    refetchLeaves();
    refetchCorrections();
    refetchPayroll();
    toast.success("HR operations data refreshed");
  };

  // Mappings
  const employeesList = useMemo(
    () => employeesData?.items ?? [],
    [employeesData]
  );
  const leaveRequests = useMemo(() => leaveData?.items ?? [], [leaveData]);
  const corrections = useMemo(
    () => correctionsData?.items ?? [],
    [correctionsData]
  );
  const payrollPeriods = useMemo(
    () => payrollData?.items ?? [],
    [payrollData]
  );

  const employeeMap = useMemo(() => {
    const map = new Map<number, (typeof employeesList)[0]>();
    employeesList.forEach((emp) => map.set(emp.id, emp));
    return map;
  }, [employeesList]);

  const departmentMap = useMemo(() => {
    const map = new Map<number, string>();
    departments.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [departments]);

  // Filters
  const filteredEmployees = useMemo(() => {
    return employeesList.filter((emp) => {
      const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      const matchesSearch =
        !employeeSearch ||
        fullName.includes(employeeSearch.toLowerCase()) ||
        emp.email.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        (emp.employeeNumber &&
          emp.employeeNumber
            .toLowerCase()
            .includes(employeeSearch.toLowerCase()));

      const matchesDept =
        deptFilter === "all" ||
        emp.departmentId?.toString() === deptFilter;

      const matchesStatus =
        statusFilter === "all" ||
        emp.employmentStatus.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employeesList, employeeSearch, deptFilter, statusFilter]);

  const pendingLeaveRequests = useMemo(
    () => leaveRequests.filter((r) => r.status.toLowerCase() === "pending"),
    [leaveRequests]
  );

  // Approval Handlers
  const handleApprove = async (id: number) => {
    try {
      await approveLeave.mutateAsync(id);
      toast.success(`Leave request #${id} approved`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to approve request");
    }
  };

  const openRejectDialog = (id: number) => {
    setSelectedLeaveId(id);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedLeaveId) return;
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejecting this leave request");
      return;
    }
    try {
      await rejectLeave.mutateAsync({
        id: selectedLeaveId,
        reason: rejectReason.trim(),
      });
      toast.success(`Leave request #${selectedLeaveId} rejected`);
      setRejectDialogOpen(false);
      setSelectedLeaveId(null);
      setRejectReason("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to reject request");
    }
  };

  const handleCalculatePayroll = async (periodId: number) => {
    try {
      await calculatePayroll.mutateAsync(periodId);
      toast.success("Payroll calculation executed successfully");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Payroll calculation failed");
    }
  };

  const handleFinalizePayroll = async (periodId: number) => {
    try {
      await finalizePayroll.mutateAsync(periodId);
      toast.success("Payroll period finalized successfully");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to finalize payroll");
    }
  };

  // Metrics
  const totalCount = reportsData?.totalEmployees ?? employeesList.length;
  const presentCount = reportsData?.presentToday ?? 0;
  const onLeaveCount = reportsData?.onLeaveToday ?? 0;
  const pendingApprovalsCount =
    pendingLeaveRequests.length + corrections.length;

  return (
    <div className="min-h-screen bg-muted/10 pb-16">
      <PortalHeader
        portalTitle="HR Operations Hub"
        portalRole={userRole === "admin" ? "admin" : "hr"}
        badgeLabel="HR Management Portal"
        description="Workforce management, live approvals, payroll administration, and department oversight."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshAll}
          disabled={isRefreshing}
          className="gap-1.5 text-xs"
        >
          <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </PortalHeader>

      <main className="mx-auto max-w-7xl space-y-6 px-4 pt-6 sm:px-6 lg:px-8">
        {/* Top HR Key Metrics */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                Total Headcount
              </CardDescription>
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                {reportsLoading ? <Skeleton className="h-8 w-16" /> : totalCount}
              </div>
              <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="size-3 text-emerald-500" />
                <span>{employeesList.filter((e) => e.employmentStatus === "active").length} active records</span>
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                Present Today
              </CardDescription>
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Clock className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {reportsLoading ? <Skeleton className="h-8 w-16" /> : presentCount}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {totalCount > 0
                  ? `${Math.round((presentCount / totalCount) * 100)}% attendance rate`
                  : "Daily attendance"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                On Leave Today
              </CardDescription>
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Calendar className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
                {reportsLoading ? <Skeleton className="h-8 w-16" /> : onLeaveCount}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Approved scheduled absences
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                Pending Approvals
              </CardDescription>
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <CalendarCheck className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                {leaveLoading || correctionsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  pendingApprovalsCount
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {pendingLeaveRequests.length} leave · {corrections.length} correction
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Quick Action Shortcuts Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Briefcase className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">HR Quick Actions</p>
              <p className="text-xs text-muted-foreground">
                Fast navigation to key administrative tools
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              render={<Link href="/dashboard/people/onboarding" />}
              size="sm"
              className="gap-1 text-xs"
            >
              <UserPlus className="size-3.5" />
              Onboard Employee
            </Button>
            <Button
              render={<Link href="/dashboard/payroll/periods" />}
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
            >
              <Wallet className="size-3.5" />
              Payroll Periods
            </Button>
            <Button
              render={<Link href="/dashboard/departments" />}
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
            >
              <Building2 className="size-3.5" />
              Departments
            </Button>
            <Button
              render={<Link href="/dashboard/reports" />}
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
            >
              <Layers className="size-3.5" />
              HR Reports
            </Button>
          </div>
        </div>

        {/* Main Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
            <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:flex sm:flex-wrap">
              <TabsTrigger value="workforce" className="gap-2">
                <Users className="size-4" />
                <span>Workforce Directory ({employeesList.length})</span>
              </TabsTrigger>
              <TabsTrigger value="approvals" className="gap-2 relative">
                <CheckCircle2 className="size-4" />
                <span>Approvals Queue</span>
                {pendingApprovalsCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-1 size-5 p-0 flex items-center justify-center text-[10px] rounded-full"
                  >
                    {pendingApprovalsCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="leave" className="gap-2">
                <Calendar className="size-4" />
                <span>Time Off Oversight</span>
              </TabsTrigger>
              <TabsTrigger value="payroll" className="gap-2">
                <Wallet className="size-4" />
                <span>Payroll Operations</span>
              </TabsTrigger>
              <TabsTrigger value="organization" className="gap-2">
                <Building2 className="size-4" />
                <span>Organization</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: WORKFORCE DIRECTORY */}
          <TabsContent value="workforce" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
                <div>
                  <CardTitle className="text-lg">Employee Directory</CardTitle>
                  <CardDescription>
                    Browse, filter, and inspect employee records across departments.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search name, email, ID..."
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      className="pl-9 h-8 text-xs"
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

                  <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val ?? "all")}>
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                      <SelectItem value="notice_period">Notice Period</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
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
                      <TableHead>Role</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeesLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={6} className="py-4">
                            <Skeleton className="h-8 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : filteredEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-36 text-center text-muted-foreground">
                          No employee records match the given criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEmployees.map((emp) => {
                        const deptName = emp.departmentId
                          ? departmentMap.get(emp.departmentId) || `Dept #${emp.departmentId}`
                          : "Unassigned";

                        const initials = `${emp.firstName[0] || ""}${emp.lastName[0] || ""}`.toUpperCase();

                        return (
                          <TableRow key={emp.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar size="sm" className="size-8">
                                  <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">
                                    {emp.firstName} {emp.lastName}
                                  </p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                                    <span>{emp.email}</span>
                                    {emp.employeeNumber && (
                                      <span className="font-mono text-[10px] text-muted-foreground/80">
                                        • {emp.employeeNumber}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs font-normal">
                                {deptName}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`capitalize text-[11px] font-semibold ${
                                  emp.role === "admin"
                                    ? "bg-red-500/10 text-red-600 border-red-500/20"
                                    : emp.role === "hr"
                                    ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                    : emp.role === "manager"
                                    ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {emp.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="capitalize text-xs text-muted-foreground">
                              {emp.employmentType?.replaceAll("_", " ") || "Full time"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  emp.employmentStatus === "active"
                                    ? "default"
                                    : emp.employmentStatus === "onboarding"
                                    ? "secondary"
                                    : "outline"
                                }
                                className="capitalize text-[11px]"
                              >
                                {emp.employmentStatus.replaceAll("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                render={
                                  <Link href={`/dashboard/people/${emp.id}`} />
                                }
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs gap-1 hover:text-primary"
                              >
                                <span>Profile</span>
                                <ChevronRight className="size-3.5" />
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
          </TabsContent>

          {/* TAB 2: APPROVALS QUEUE */}
          <TabsContent value="approvals" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">
                        Pending Leave Applications ({pendingLeaveRequests.length})
                      </CardTitle>
                      <CardDescription>
                        Time off requests awaiting HR decision and approval.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Dates & Duration</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead className="text-right">Decision</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaveLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                            Loading approval items...
                          </TableCell>
                        </TableRow>
                      ) : pendingLeaveRequests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                            No pending leave applications in the queue.
                          </TableCell>
                        </TableRow>
                      ) : (
                        pendingLeaveRequests.map((req) => {
                          const emp = employeeMap.get(req.employeeId);
                          const startStr = req.startDate
                            ? new Date(req.startDate).toLocaleDateString()
                            : "-";
                          const endStr = req.endDate
                            ? new Date(req.endDate).toLocaleDateString()
                            : "-";

                          return (
                            <TableRow key={req.id}>
                              <TableCell>
                                <p className="font-medium text-sm">
                                  {emp ? `${emp.firstName} ${emp.lastName}` : `Emp #${req.employeeId}`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {emp?.email}
                                </p>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize text-xs">
                                  {req.leaveType}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs tabular-nums">
                                <div>{startStr} – {endStr}</div>
                                <div className="text-muted-foreground">
                                  {req.days} {Number(req.days) === 1 ? "day" : "days"} ({req.unit})
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                                {req.reason || "No comment provided"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-300 dark:border-emerald-700/50"
                                    onClick={() => handleApprove(req.id)}
                                    disabled={approveLeave.isPending}
                                  >
                                    <CheckCircle2 className="size-3.5 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                                    onClick={() => openRejectDialog(req.id)}
                                    disabled={rejectLeave.isPending}
                                  >
                                    <XCircle className="size-3.5 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Attendance Corrections List */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">
                    Attendance Correction Requests ({corrections.length})
                  </CardTitle>
                  <CardDescription>
                    Manual punch corrections submitted by workforce members.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User / Identity</TableHead>
                        <TableHead>Correction Date</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Logged At</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {correctionsLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                            Loading corrections...
                          </TableCell>
                        </TableRow>
                      ) : corrections.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                            No attendance correction requests recorded.
                          </TableCell>
                        </TableRow>
                      ) : (
                        corrections.map((corr) => (
                          <TableRow key={corr.id}>
                            <TableCell className="font-mono text-xs">
                              {corr.userId}
                            </TableCell>
                            <TableCell className="text-xs tabular-nums">
                              {corr.correctionDate
                                ? new Date(corr.correctionDate).toLocaleDateString()
                                : "-"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-sm truncate">
                              {corr.reason || "Manual punch adjustment"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground tabular-nums">
                              {new Date(corr.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary" className="text-xs">
                                Logged
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 3: TIME OFF OVERSIGHT */}
          <TabsContent value="leave" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Complete Leave Applications Log
                  </CardTitle>
                  <CardDescription>
                    All historical and scheduled leave requests.
                  </CardDescription>
                </div>
                <Button
                  render={<Link href="/dashboard/time-off" />}
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1"
                >
                  <span>Leave Policies</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>From - To</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rejection Note / Comment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                          Loading leave records...
                        </TableCell>
                      </TableRow>
                    ) : leaveRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                          No leave requests on record yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      leaveRequests.slice(0, 25).map((req) => {
                        const emp = employeeMap.get(req.employeeId);
                        return (
                          <TableRow key={req.id}>
                            <TableCell className="font-medium text-xs">
                              {emp ? `${emp.firstName} ${emp.lastName}` : `Emp #${req.employeeId}`}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize text-xs">
                                {req.leaveType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs tabular-nums">
                              {new Date(req.startDate).toLocaleDateString()} to{" "}
                              {new Date(req.endDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-xs tabular-nums">
                              {req.days}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  req.status.toLowerCase() === "approved"
                                    ? "default"
                                    : req.status.toLowerCase() === "rejected"
                                    ? "destructive"
                                    : "secondary"
                                }
                                className="capitalize text-xs"
                              >
                                {req.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                              {req.rejectionReason || req.decisionComment || "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: PAYROLL OPERATIONS */}
          <TabsContent value="payroll" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 gap-3">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Payroll Periods & Cycles
                  </CardTitle>
                  <CardDescription>
                    Execute batch payroll calculations and finalize monthly disbursements.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    render={<Link href="/dashboard/payroll/periods" />}
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1"
                  >
                    <Wallet className="size-3.5" />
                    Manage Pay Periods
                  </Button>
                  <Button
                    render={<Link href="/dashboard/payroll/salary-structures" />}
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1"
                  >
                    Salary Structures
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period Name</TableHead>
                      <TableHead>Date Range</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-28 text-center text-muted-foreground">
                          Loading payroll periods...
                        </TableCell>
                      </TableRow>
                    ) : payrollPeriods.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-28 text-center text-muted-foreground">
                          No payroll periods found. Create one to calculate payroll.
                        </TableCell>
                      </TableRow>
                    ) : (
                      payrollPeriods.map((period) => (
                        <TableRow key={period.id}>
                          <TableCell className="font-medium text-sm">
                            {period.name}
                          </TableCell>
                          <TableCell className="text-xs tabular-nums text-muted-foreground">
                            {period.startDate ? new Date(period.startDate).toLocaleDateString() : "-"} –{" "}
                            {period.endDate ? new Date(period.endDate).toLocaleDateString() : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                period.status === "finalized"
                                  ? "default"
                                  : period.status === "processing"
                                  ? "secondary"
                                  : "outline"
                              }
                              className="capitalize text-xs"
                            >
                              {period.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {period.status !== "finalized" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs gap-1"
                                    onClick={() => handleCalculatePayroll(period.id)}
                                    disabled={calculatePayroll.isPending}
                                  >
                                    <Calculator className="size-3" />
                                    Calculate
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="h-7 text-xs gap-1"
                                    onClick={() => handleFinalizePayroll(period.id)}
                                    disabled={finalizePayroll.isPending}
                                  >
                                    <Check className="size-3" />
                                    Finalize
                                  </Button>
                                </>
                              )}
                              <Button
                                render={
                                  <Link href={`/dashboard/payroll?periodId=${period.id}`} />
                                }
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                              >
                                View Slips
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: ORGANIZATION */}
          <TabsContent value="organization" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    Departments & Headcount
                  </CardTitle>
                  <CardDescription>
                    Organizational unit distribution
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {departments.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No departments registered.</p>
                  ) : (
                    departments.map((dept) => {
                      const count = employeesList.filter(
                        (e) => e.departmentId === dept.id
                      ).length;
                      return (
                        <div
                          key={dept.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div>
                            <p className="text-sm font-medium">{dept.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {dept.description || "Active department"}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-xs tabular-nums">
                            {count} member{count === 1 ? "" : "s"}
                          </Badge>
                        </div>
                      );
                    })
                  )}
                  <Button
                    render={<Link href="/dashboard/departments" />}
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs mt-2"
                  >
                    Manage Departments
                    <ChevronRight className="size-3.5 ml-1" />
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    Upcoming Public Holidays
                  </CardTitle>
                  <CardDescription>
                    Scheduled company-wide holiday calendar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {holidays.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No holidays scheduled.</p>
                  ) : (
                    holidays.slice(0, 5).map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <span className="text-[10px] uppercase font-bold">
                            {new Date(h.holidayDate).toLocaleDateString(undefined, {
                              month: "short",
                            })}
                          </span>
                          <span className="text-sm font-semibold leading-none">
                            {new Date(h.holidayDate).getDate()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{h.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {h.description || "Company Holiday"}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <Button
                    render={<Link href="/dashboard/holidays" />}
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs mt-2"
                  >
                    View Holiday Calendar
                    <ChevronRight className="size-3.5 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Reject Leave Request Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              Please enter a clear reason for rejecting this leave request. The employee will receive this feedback.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              placeholder="e.g. Milestone delivery window or staffing constraints during this period..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="text-sm"
            />
          </div>
          <DialogFooter showCloseButton>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={rejectLeave.isPending || !rejectReason.trim()}
            >
              {rejectLeave.isPending ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
