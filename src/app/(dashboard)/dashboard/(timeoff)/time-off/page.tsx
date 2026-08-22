"use client";

import React, { useState, useMemo } from "react";
import {
  CalendarClock,
  Calendar,
  Plus,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plane,
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
import {
  useLeaveRequests,
  useLeaveTypes,
  useSubmitLeaveRequest,
  useLeaveAllocations,
} from "@/hooks/use-leave";
import { useMe } from "@/hooks/use-me";

const quotaCardStyles = [
  {
    card: "border-emerald-500/20 bg-linear-to-br from-emerald-500/10 via-card to-card",
    icon: Plane,
    iconClassName: "text-emerald-500",
  },
  {
    card: "border-blue-500/20 bg-linear-to-br from-blue-500/10 via-card to-card",
    icon: Calendar,
    iconClassName: "text-blue-500",
  },
  {
    card: "border-amber-500/20 bg-linear-to-br from-amber-500/10 via-card to-card",
    icon: CalendarClock,
    iconClassName: "text-amber-500",
  },
] as const;

export default function TimeOffPage() {
  // Apply Form State
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: meData } = useMe();
  const currentEmployeeId = meData?.employee?.id;

  const { data: leaveData, isLoading, refetch } = useLeaveRequests({ limit: 100 });
  const { data: leaveTypesData, isLoading: leaveTypesLoading } = useLeaveTypes();
  const allocationsQuery = useLeaveAllocations(currentEmployeeId);
  const submitLeaveMutation = useSubmitLeaveRequest();

  const leaveRequests = useMemo(() => leaveData?.items ?? [], [leaveData]);
  const leaveTypes = (leaveTypesData ?? []).filter((type) => type.active);
  const allocations = allocationsQuery.data ?? [];

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveType || !startDate || !endDate) {
      toast.error("Choose a leave type and specify both start and end dates");
      return;
    }
    if (endDate < startDate) {
      toast.error("The end date cannot be before the start date");
      return;
    }

    try {
      await submitLeaveMutation.mutateAsync({
        leaveType,
        startDate,
        endDate,
        reason: reason.trim() || undefined,
        employeeId: currentEmployeeId,
      });

      toast.success("Leave request submitted successfully!");
      setIsApplyOpen(false);
      setReason("");
      setStartDate("");
      setEndDate("");
      refetch();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to submit leave request";
      toast.error(errorMsg);
    }
  };

  // Filtered & Paginated records
  const filteredRequests = useMemo(() => {
    return leaveRequests.filter((req) => {
      const matchesSearch =
        req.leaveType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (req.reason && req.reason.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" ||
        req.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [leaveRequests, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredRequests.length / limit) || 1;
  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredRequests.slice(start, start + limit);
  }, [filteredRequests, page, limit]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
            <CalendarClock className="size-7 text-primary" />
            Time Off &amp; Leave Balance
          </h1>
          <p className="text-sm text-muted-foreground">
            Request leaves, track approvals, and view your remaining annual quotas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetch();
              toast.success("Time off data refreshed");
            }}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Drawer open={isApplyOpen} onOpenChange={setIsApplyOpen}>
            <DrawerTrigger  >
              <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground">
                <Plus className="size-4" />
                Apply for Leave
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <form onSubmit={handleApplyLeave}>
                <DrawerHeader>
                  <DrawerTitle>Apply for Time Off</DrawerTitle>
                  <DrawerDescription>
                    Submit a leave request for managerial review and approval.
                  </DrawerDescription>
                </DrawerHeader>
                <div className="grid gap-4 p-4 max-w-md mx-auto">
                  <div className="grid gap-2">
                    <Label htmlFor="leaveType">Leave Type</Label>
                    <Select
                      value={leaveType}
                      onValueChange={(value) => setLeaveType(value ?? "")}
                      disabled={leaveTypesLoading || leaveTypes.length === 0}
                    >
                      <SelectTrigger id="leaveType">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {leaveTypes.map((type) => (
                          <SelectItem key={type.id} value={type.name}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {leaveTypesLoading ? (
                    <p className="text-sm text-muted-foreground">Loading available leave types…</p>
                  ) : leaveTypes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No leave types are available. Contact HR for assistance.</p>
                  ) : null}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="reason">Reason / Notes</Label>
                    <Input
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. Annual vacation break"
                    />
                  </div>
                </div>
                <DrawerFooter className="max-w-md mx-auto w-full">
                  <Button type="submit" disabled={submitLeaveMutation.isPending || leaveTypesLoading || leaveTypes.length === 0}>
                    {submitLeaveMutation.isPending ? "Submitting..." : "Submit Request"}
                  </Button>
                  <DrawerClose  >
                    <Button variant="outline">Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </form>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      {/* Leave Quota Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {allocationsQuery.isLoading ? (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardContent className="p-6 text-sm text-muted-foreground">Loading leave balances…</CardContent>
          </Card>
        ) : allocationsQuery.isError ? (
          <Card className="border-destructive/30 sm:col-span-2 lg:col-span-3">
            <CardContent className="flex items-center justify-between gap-3 p-5 text-sm text-destructive">
              Leave balances could not be loaded.
              <Button size="sm" variant="outline" onClick={() => void allocationsQuery.refetch()}>Try again</Button>
            </CardContent>
          </Card>
        ) : allocations.length === 0 ? (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardContent className="p-6 text-sm text-muted-foreground">No leave balances have been allocated yet.</CardContent>
          </Card>
        ) : (
          allocations.slice(0, 3).map((allocation, index) => {
            const style = quotaCardStyles[index % quotaCardStyles.length];
            const Icon = style.icon;
            return (
              <Card key={allocation.id} className={style.card}>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center justify-between">
                    <span>{allocation.leaveType}</span>
                    <Icon className={`size-4 ${style.iconClassName}`} />
                  </CardDescription>
                  <CardTitle className="text-3xl font-bold">
                    {allocation.allocatedDays} <span className="text-sm font-normal text-muted-foreground">days</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  {allocation.usedDays} days used this year
                </CardContent>
              </Card>
            );
          })
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Total Requests</span>
              <CheckCircle2 className="size-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{leaveRequests.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Recorded in company system
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Leave History ({filteredRequests.length})</CardTitle>
            <CardDescription>
              Past and pending time off applications.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search type or reason..."
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
              onValueChange={(val) => {
                if (val) {
                  setStatusFilter(val);
                  setPage(1);
                }
              }}
            >
              <SelectTrigger className="w-[140px]">
                <Filter className="size-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[90px]">ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-primary" />
                      Loading leave history...
                    </TableCell>
                  </TableRow>
                ) : paginatedRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No leave requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRequests.map((req) => (
                    <TableRow key={req.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{req.id}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {req.leaveType}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums text-sm">
                        {req.startDate ? new Date(req.startDate).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell className="tabular-nums text-sm">
                        {req.endDate ? new Date(req.endDate).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-sm text-muted-foreground">
                        {req.reason || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            req.status === "pending"
                              ? "secondary"
                              : req.status === "approved"
                                ? "default"
                                : "destructive"
                          }
                          className="capitalize"
                        >
                          {req.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            <div className="text-xs text-muted-foreground">
              Showing {filteredRequests.length > 0 ? (page - 1) * limit + 1 : 0} to{" "}
              {Math.min(page * limit, filteredRequests.length)} of {filteredRequests.length} requests
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
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
