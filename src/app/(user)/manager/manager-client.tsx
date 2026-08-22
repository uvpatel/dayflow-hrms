"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Search,
  RefreshCw,
  ArrowRight,
  UserCheck,
  CalendarDays,
  FileCheck,
  ChevronRight,
  Briefcase,
  AlertCircle,
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

import { useMyTeam } from "@/hooks/use-employees";
import {
  useLeaveRequests,
  useApproveLeaveRequest,
  useRejectLeaveRequest,
} from "@/hooks/use-leave";
import { useAttendanceCorrections } from "@/hooks/use-attendance";
import { useHolidays } from "@/hooks/use-organization";

interface ManagerDashboardClientProps {
  userRole: "admin" | "hr" | "manager" | "employee";
}

export function ManagerDashboardClient({
  userRole,
}: ManagerDashboardClientProps) {
  const [activeTab, setActiveTab] = useState("team");
  const [searchQuery, setSearchQuery] = useState("");

  // Rejection modal
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Queries
  const {
    data: teamData,
    isLoading: teamLoading,
    refetch: refetchTeam,
    isFetching: teamFetching,
  } = useMyTeam();

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

  const { data: holidays = [] } = useHolidays();

  // Mutations
  const approveLeave = useApproveLeaveRequest();
  const rejectLeave = useRejectLeaveRequest();

  const teamList = useMemo(() => teamData?.items ?? [], [teamData]);
  const teamMemberIds = useMemo(
    () => new Set(teamList.map((m) => m.id)),
    [teamList]
  );

  const teamLeaveRequests = useMemo(() => {
    const all = leaveData?.items ?? [];
    if (teamMemberIds.size === 0) return [];
    return all.filter((req) => teamMemberIds.has(req.employeeId));
  }, [leaveData, teamMemberIds]);

  const pendingTeamLeaves = useMemo(
    () => teamLeaveRequests.filter((r) => r.status.toLowerCase() === "pending"),
    [teamLeaveRequests]
  );

  const correctionsList = useMemo(
    () => correctionsData?.items ?? [],
    [correctionsData]
  );

  const filteredTeam = useMemo(() => {
    return teamList.filter((emp) => {
      const name = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      return (
        !searchQuery ||
        name.includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.employeeNumber &&
          emp.employeeNumber.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [teamList, searchQuery]);

  const teamMemberMap = useMemo(() => {
    const map = new Map<number, (typeof teamList)[0]>();
    teamList.forEach((m) => map.set(m.id, m));
    return map;
  }, [teamList]);

  const isRefreshing = teamFetching || teamLoading || leaveLoading;

  const handleRefresh = () => {
    refetchTeam();
    refetchLeaves();
    refetchCorrections();
    toast.success("Team dashboard refreshed");
  };

  const handleApprove = async (id: number) => {
    try {
      await approveLeave.mutateAsync(id);
      toast.success(`Leave request #${id} approved`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to approve request");
    }
  };

  const openRejectModal = (id: number) => {
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

  const pendingApprovalsCount = pendingTeamLeaves.length;

  return (
    <div className="min-h-screen bg-muted/10 pb-16">
      <PortalHeader
        portalTitle="Manager Workspace"
        portalRole={userRole === "admin" ? "admin" : "manager"}
        badgeLabel="Manager Team Hub"
        description="Monitor team performance, process approvals, and manage direct reports."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-1.5 text-xs"
        >
          <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </PortalHeader>

      <main className="mx-auto max-w-7xl space-y-6 px-4 pt-6 sm:px-6 lg:px-8">
        {/* Team Pulse Metrics */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                Direct Reports
              </CardDescription>
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Users className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                {teamLoading ? <Skeleton className="h-8 w-14" /> : teamList.length}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Assigned team members
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                Active Team Members
              </CardDescription>
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <UserCheck className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {teamLoading ? (
                  <Skeleton className="h-8 w-14" />
                ) : (
                  teamList.filter((m) => m.employmentStatus === "active").length
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                In good standing
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                Pending Team Approvals
              </CardDescription>
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <FileCheck className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                {leaveLoading ? (
                  <Skeleton className="h-8 w-14" />
                ) : (
                  pendingApprovalsCount
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Requests awaiting your decision
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                Upcoming Holidays
              </CardDescription>
              <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <CalendarDays className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                {holidays.length}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Scheduled org closures
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Manager Quick Navigation Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Briefcase className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Manager Actions</p>
              <p className="text-xs text-muted-foreground">
                Fast team shortcuts and management operations
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              render={<Link href="/dashboard/my-team" />}
              size="sm"
              className="gap-1 text-xs"
            >
              <Users className="size-3.5" />
              Open My Team
            </Button>
            <Button
              render={<Link href="/dashboard/approvals" />}
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
            >
              <CheckCircle2 className="size-3.5" />
              Approvals Center
            </Button>
            <Button
              render={<Link href="/dashboard/attendance" />}
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
            >
              <Clock className="size-3.5" />
              Attendance View
            </Button>
            <Button
              render={<Link href="/dashboard/reports" />}
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
            >
              <Calendar className="size-3.5" />
              Team Reports
            </Button>
          </div>
        </div>

        {/* Tabbed View */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
            <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:flex sm:flex-wrap">
              <TabsTrigger value="team" className="gap-2">
                <Users className="size-4" />
                <span>Direct Reports ({teamList.length})</span>
              </TabsTrigger>
              <TabsTrigger value="approvals" className="gap-2 relative">
                <CheckCircle2 className="size-4" />
                <span>Pending Approvals</span>
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
                <span>Team Time Off Schedule</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: DIRECT REPORTS */}
          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
                <div>
                  <CardTitle className="text-lg">Team Roster</CardTitle>
                  <CardDescription>
                    All direct reports assigned to your management group.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-8 text-xs"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {teamLoading ? (
                  <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                  </div>
                ) : filteredTeam.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <AlertCircle className="size-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">
                      {teamList.length === 0
                        ? "No direct reports are assigned to you in the organization tree."
                        : "No team members match your search."}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Contact HR if your team hierarchy needs to be updated.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredTeam.map((employee) => {
                      const initials = `${employee.firstName[0] || ""}${employee.lastName[0] || ""}`.toUpperCase();

                      return (
                        <div
                          key={employee.id}
                          className="group relative flex flex-col justify-between rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-xs"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <Avatar size="default" className="size-10">
                                <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-semibold text-sm truncate">
                                  {employee.firstName} {employee.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {employee.email}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={
                                employee.employmentStatus === "active"
                                  ? "default"
                                  : "outline"
                              }
                              className="capitalize text-[10px]"
                            >
                              {employee.employmentStatus.replaceAll("_", " ")}
                            </Badge>
                          </div>

                          <div className="mt-4 flex items-center justify-between border-t pt-3">
                            <span className="font-mono text-xs text-muted-foreground">
                              {employee.employeeNumber || `EMP #${employee.id}`}
                            </span>
                            <Button
                              render={
                                <Link href={`/dashboard/my-team/${employee.id}`} />
                              }
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1 hover:text-primary p-1"
                            >
                              <span>Details</span>
                              <ChevronRight className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: PENDING APPROVALS */}
          <TabsContent value="approvals" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  Team Leave Requests ({pendingTeamLeaves.length})
                </CardTitle>
                <CardDescription>
                  Direct report leave submissions requiring manager authorization.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Member</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Period & Duration</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                          Loading team approvals...
                        </TableCell>
                      </TableRow>
                    ) : pendingTeamLeaves.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                          No pending leave requests from your team members.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingTeamLeaves.map((req) => {
                        const emp = teamMemberMap.get(req.employeeId);
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
                              <div>{startStr} to {endStr}</div>
                              <div className="text-muted-foreground">
                                {req.days} {Number(req.days) === 1 ? "day" : "days"} ({req.unit})
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                              {req.reason || "No remarks provided"}
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
                                  onClick={() => openRejectModal(req.id)}
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
          </TabsContent>

          {/* TAB 3: TEAM TIME OFF SCHEDULE */}
          <TabsContent value="leave" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Team Time Off Calendar
                  </CardTitle>
                  <CardDescription>
                    All scheduled and approved leaves across your team.
                  </CardDescription>
                </div>
                <Button
                  render={<Link href="/dashboard/approvals" />}
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1"
                >
                  <span>Approvals Hub</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Member</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                          Loading team leave schedules...
                        </TableCell>
                      </TableRow>
                    ) : teamLeaveRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                          No leave applications recorded for your direct reports.
                        </TableCell>
                      </TableRow>
                    ) : (
                      teamLeaveRequests.map((req) => {
                        const emp = teamMemberMap.get(req.employeeId);
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
                              {new Date(req.startDate).toLocaleDateString()} –{" "}
                              {new Date(req.endDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-xs tabular-nums">
                              {req.days} days
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
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Reject Leave Request Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Team Leave Request</DialogTitle>
            <DialogDescription>
              Please enter feedback explaining why this leave request cannot be accommodated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              placeholder="e.g. Inadequate team coverage for scheduled sprint deliverable..."
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
