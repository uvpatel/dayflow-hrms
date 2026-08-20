"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  CalendarClock,
  Calendar,
  Plus,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Plane,
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
import { SiteHeader } from "@/components/main/site-header";

interface LeaveRequest {
  id: number;
  employeeId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
  status: string;
  createdAt?: string;
}

interface LeaveType {
  id: number;
  name: string;
  description?: string | null;
}

export default function TimeOffPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Apply Form State
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [leaveType, setLeaveType] = useState("paid");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  const currentEmployeeId = 1;

  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      const [reqRes, typeRes] = await Promise.all([
        fetch("/api/v1/leave-requests?limit=50"),
        fetch("/api/v1/leave-types"),
      ]);

      if (reqRes.ok) {
        const reqJson = await reqRes.json();
        if (reqJson.success && Array.isArray(reqJson.data)) {
          setLeaveRequests(reqJson.data);
        }
      }

      if (typeRes.ok) {
        const typeJson = await typeRes.json();
        if (typeJson.success && Array.isArray(typeJson.data)) {
          setLeaveTypes(typeJson.data);
        }
      }
    } catch (err) {
      console.error("Failed to load time-off data:", err);
      toast.error("Failed to fetch leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await fetch("/api/v1/leave-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: currentEmployeeId,
          leaveType,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          reason,
          status: "pending",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Leave request submitted successfully!");
        setIsApplyOpen(false);
        setReason("");
        setStartDate("");
        setEndDate("");
        fetchLeaveData();
      } else {
        toast.error(data.error || "Failed to submit leave request");
      }
    } catch (err) {
      toast.error("Error submitting leave request");
    } finally {
      setActionLoading(false);
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
            <SiteHeader />
            <CalendarClock className="size-7 text-primary" />
            
            Time Off & Leave Balance
          </h1>
          <p className="text-sm text-muted-foreground">
            Request leaves, track approvals, and view your remaining annual quotas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLeaveData}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Drawer open={isApplyOpen} onOpenChange={setIsApplyOpen}>
            <DrawerTrigger>
              <Button size="sm" className="gap-1.5">
                <Plus className="size-4" />
                Apply for Leave
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <form onSubmit={handleApplyLeave}>
                <DrawerHeader>
                  <DrawerTitle>Apply for Time Off</DrawerTitle>
                  <DrawerDescription>
                    Submit a leave request for managerial approval.
                  </DrawerDescription>
                </DrawerHeader>
                <div className="grid gap-4 p-4 max-w-md mx-auto">
                  <div className="grid gap-2">
                    <Label htmlFor="leaveType">Leave Type</Label>
                    <Select
                      value={leaveType}
                      onValueChange={(val) => {
                        if (val) setLeaveType(val);
                      }}
                    >
                      <SelectTrigger id="leaveType">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid Time Off (PTO)</SelectItem>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="casual">Casual Leave</SelectItem>
                        <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                        {leaveTypes.map((t) => (
                          <SelectItem key={t.id} value={t.name.toLowerCase()}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                      placeholder="e.g. Family vacation"
                    />
                  </div>
                </div>
                <DrawerFooter className="max-w-md mx-auto w-full">
                  <Button type="submit" disabled={actionLoading}>
                    {actionLoading ? "Submitting..." : "Submit Request"}
                  </Button>
                  <DrawerClose>
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
        <Card className="bg-linear-to-br from-emerald-500/10 via-card to-card border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Paid Time Off (PTO)</span>
              <Plane className="size-4 text-emerald-500" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold">14 <span className="text-sm font-normal text-muted-foreground">/ 18 days</span></CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            4 days used this year
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-blue-500/10 via-card to-card border-blue-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Sick Leave</span>
              <Calendar className="size-4 text-blue-500" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold">8 <span className="text-sm font-normal text-muted-foreground">/ 10 days</span></CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            2 days used this year
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-amber-500/10 via-card to-card border-amber-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Casual Leave</span>
              <CalendarClock className="size-4 text-amber-500" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold">5 <span className="text-sm font-normal text-muted-foreground">/ 7 days</span></CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            2 days used this year
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Total Leave Taken</span>
              <CheckCircle2 className="size-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold">8 days</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Across all leave types
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">My Leave History</CardTitle>
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
                {loading ? (
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
                        {new Date(req.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="tabular-nums text-sm">
                        {new Date(req.endDate).toLocaleDateString()}
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