"use client";

import React, { useState, useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  FileCheck2,
  User,
  CalendarCheck,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useLeaveRequests, useApproveLeaveRequest, useRejectLeaveRequest } from "@/hooks/use-leave";
import {
  useAttendanceCorrections,
  useDecideAttendanceCorrection,
} from "@/hooks/use-attendance";
import { useEmployees } from "@/hooks/use-employees";

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState("leave");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectionTarget, setRejectionTarget] = useState<{
    kind: "leave" | "correction";
    id: number;
  } | null>(null);
  const [rejectionComment, setRejectionComment] = useState("");

  const { data: leaveData, isLoading: leaveLoading, refetch: refetchLeaves } = useLeaveRequests({ limit: 100 });
  const { data: correctionsData, isLoading: corrLoading, refetch: refetchCorrections } = useAttendanceCorrections({ limit: 100 });
  const { data: employeesData } = useEmployees({ limit: 100 });

  const approveLeaveMutation = useApproveLeaveRequest();
  const rejectLeaveMutation = useRejectLeaveRequest();
  const decideCorrectionMutation = useDecideAttendanceCorrection();

  const leaveRequests = useMemo(() => leaveData?.items ?? [], [leaveData]);
  const corrections = useMemo(
    () => correctionsData?.items ?? [],
    [correctionsData],
  );

  const employees = useMemo(() => {
    const map: Record<number, { firstName: string; lastName: string; email: string }> = {};
    (employeesData?.items ?? []).forEach((emp) => {
      map[emp.id] = emp;
    });
    return map;
  }, [employeesData]);

  const handleRefresh = () => {
    refetchLeaves();
    refetchCorrections();
    toast.success("Approvals queue refreshed");
  };

  const handleApproveLeave = async (id: number) => {
    try {
      await approveLeaveMutation.mutateAsync(id);
      toast.success(`Leave request #${id} approved successfully!`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to approve request";
      toast.error(errorMsg);
    }
  };

  const openRejectionDialog = (
    kind: "leave" | "correction",
    id: number,
  ) => {
    setRejectionComment("");
    setRejectionTarget({ kind, id });
  };

  const closeRejectionDialog = () => {
    setRejectionTarget(null);
    setRejectionComment("");
  };

  const handleSubmitRejection = async () => {
    if (!rejectionTarget) return;
    const comment = rejectionComment.trim();
    if (comment.length < 3) {
      toast.error("Add a rejection comment of at least 3 characters");
      return;
    }

    try {
      if (rejectionTarget.kind === "leave") {
        await rejectLeaveMutation.mutateAsync({
          id: rejectionTarget.id,
          reason: comment,
        });
        toast.success(`Leave request #${rejectionTarget.id} rejected`);
      } else {
        await decideCorrectionMutation.mutateAsync({
          id: rejectionTarget.id,
          decision: "rejected",
          comment,
        });
        toast.success(
          `Attendance correction #${rejectionTarget.id} rejected`,
        );
      }
      closeRejectionDialog();
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to reject request";
      toast.error(errorMsg);
    }
  };

  const handleCorrectionDecision = async (
    id: number,
    decision: "approved",
  ) => {
    try {
      await decideCorrectionMutation.mutateAsync({
        id,
        decision,
      });
      toast.success(`Attendance correction #${id} ${decision}`);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : `Failed to ${decision} correction`,
      );
    }
  };

  const filteredLeave = useMemo(() => {
    return leaveRequests.filter((req) => {
      const matchesStatus = statusFilter === "all" || req.status.toLowerCase() === statusFilter.toLowerCase();
      const emp = employees[req.employeeId];
      const name = emp ? `${emp.firstName} ${emp.lastName}`.toLowerCase() : "";
      const matchesSearch = !searchQuery || name.includes(searchQuery.toLowerCase()) || req.leaveType.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [leaveRequests, statusFilter, employees, searchQuery]);

  const filteredCorrections = useMemo(() => {
    return corrections.filter((c) => {
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      const matchesSearch = !searchQuery || c.userId.toLowerCase().includes(searchQuery.toLowerCase()) || (c.reason && c.reason.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [corrections, searchQuery, statusFilter]);

  const pendingLeaveCount = leaveRequests.filter((r) => r.status.toLowerCase() === "pending").length;
  const pendingCorrectionCount = corrections.filter(
    (correction) => correction.status === "pending",
  ).length;
  const loading = leaveLoading || corrLoading;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Approval Workflows
          </h1>
          <p className="text-sm text-muted-foreground">
            Review and process pending leave applications and attendance correction requests.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="self-start sm:self-auto gap-2"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Leave Requests</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-500 flex items-center gap-2">
              <Clock className="size-5" />
              {pendingLeaveCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Attendance Corrections</CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-500 flex items-center gap-2">
              <CalendarCheck className="size-5" />
              {pendingCorrectionCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Action Items</CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileCheck2 className="size-5 text-primary" />
              {pendingLeaveCount + pendingCorrectionCount}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList className="grid w-full sm:w-80 grid-cols-2">
            <TabsTrigger value="leave" className="gap-2">
              <Calendar className="size-4" />
              <span>Leave ({pendingLeaveCount})</span>
            </TabsTrigger>
            <TabsTrigger value="attendance" className="gap-2">
              <CalendarCheck className="size-4" />
              <span>Attendance ({pendingCorrectionCount})</span>
            </TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search employee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value ?? "all")}
            >
              <SelectTrigger className="w-36 h-9">
                <Filter className="size-3.5 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="all">All Statuses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Leave Requests Tab */}
        <TabsContent value="leave">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Loading leave requests...
                      </TableCell>
                    </TableRow>
                  ) : filteredLeave.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No leave requests found matching filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeave.map((req) => {
                      const emp = employees[req.employeeId];
                      const isPending = req.status.toLowerCase() === "pending";
                      return (
                        <TableRow key={req.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs">
                                {emp ? emp.firstName[0] : <User className="size-3.5" />}
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {emp ? `${emp.firstName} ${emp.lastName}` : `Emp #${req.employeeId}`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {emp?.email || ""}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {req.leaveType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm tabular-nums">
                            {req.startDate ? new Date(req.startDate).toLocaleDateString() : "-"} to {req.endDate ? new Date(req.endDate).toLocaleDateString() : "-"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                            {req.reason || "No remarks provided"}
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
                              className="capitalize"
                            >
                              {req.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                                  onClick={() => handleApproveLeave(req.id)}
                                  disabled={approveLeaveMutation.isPending}
                                >
                                  <CheckCircle2 className="size-3.5 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-destructive hover:bg-destructive/10 border-destructive/30"
                                  onClick={() =>
                                    openRejectionDialog("leave", req.id)
                                  }
                                  disabled={rejectLeaveMutation.isPending}
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Corrections Tab */}
        <TabsContent value="attendance">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Correction Date</TableHead>
                    <TableHead>Reason / Notes</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Loading attendance corrections...
                      </TableCell>
                    </TableRow>
                  ) : filteredCorrections.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No attendance correction requests found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCorrections.map((corr) => {
                      const isPending = corr.status === "pending";
                      return (
                        <TableRow key={corr.id}>
                        <TableCell className="font-mono text-sm">
                          {corr.userId}
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">
                          {corr.correctionDate ? new Date(corr.correctionDate).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-sm truncate">
                          {corr.reason || "Manual time adjustment"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground tabular-nums">
                          {corr.createdAt ? new Date(corr.createdAt).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              corr.status === "approved"
                                ? "default"
                                : corr.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="capitalize"
                          >
                            {corr.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                disabled={decideCorrectionMutation.isPending}
                                onClick={() =>
                                  void handleCorrectionDecision(corr.id, "approved")
                                }
                              >
                                <CheckCircle2 className="mr-1 size-3.5" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-destructive/30 text-destructive hover:bg-destructive/10"
                                disabled={decideCorrectionMutation.isPending}
                                onClick={() =>
                                  openRejectionDialog("correction", corr.id)
                                }
                              >
                                <XCircle className="mr-1 size-3.5" />
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Processed
                            </span>
                          )}
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

      <Dialog
        open={rejectionTarget !== null}
        onOpenChange={(open) => {
          if (!open) closeRejectionDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject request</DialogTitle>
            <DialogDescription>
              Explain the decision clearly. The employee will receive this
              comment with the rejection notification.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="rejection-comment">Rejection comment</Label>
            <Textarea
              id="rejection-comment"
              value={rejectionComment}
              onChange={(event) => setRejectionComment(event.target.value)}
              placeholder="Describe the reason for rejecting this request"
              minLength={3}
              maxLength={1_000}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeRejectionDialog}
              disabled={
                rejectLeaveMutation.isPending ||
                decideCorrectionMutation.isPending
              }
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleSubmitRejection()}
              disabled={
                rejectionComment.trim().length < 3 ||
                rejectLeaveMutation.isPending ||
                decideCorrectionMutation.isPending
              }
            >
              {rejectLeaveMutation.isPending ||
              decideCorrectionMutation.isPending
                ? "Rejecting…"
                : "Reject request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
