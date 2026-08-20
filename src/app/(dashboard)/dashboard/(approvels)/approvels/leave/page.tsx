"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  AlertCircle,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  User,
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

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export default function LeaveApprovalsPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Record<number, Employee>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Fetch Leave Requests & Employees
  const fetchData = async () => {
    try {
      setLoading(true);
      const [leaveRes, empRes] = await Promise.all([
        fetch("/api/v1/leave-requests?limit=50"),
        fetch("/api/v1/employees?limit=50"),
      ]);

      if (leaveRes.ok) {
        const leaveJson = await leaveRes.json();
        if (leaveJson.success && Array.isArray(leaveJson.data)) {
          setLeaveRequests(leaveJson.data);
        }
      }

      if (empRes.ok) {
        const empJson = await empRes.json();
        if (empJson.success && Array.isArray(empJson.data)) {
          const empMap: Record<number, Employee> = {};
          empJson.data.forEach((e: Employee) => {
            empMap[e.id] = e;
          });
          setEmployees(empMap);
        }
      }
    } catch (err) {
      console.error("Failed to load leave approvals:", err);
      toast.error("Failed to fetch leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Approve Request
  const handleApprove = async (id: number) => {
    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/v1/leave-requests/${id}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Leave request #${id} approved successfully!`);
        fetchData();
      } else {
        toast.error(data.error || "Failed to approve leave request");
      }
    } catch (err) {
      toast.error("An error occurred while approving");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reject Request
  const handleReject = async (id: number) => {
    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/v1/leave-requests/${id}/reject`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Leave request #${id} rejected`);
        fetchData();
      } else {
        toast.error(data.error || "Failed to reject leave request");
      }
    } catch (err) {
      toast.error("An error occurred while rejecting");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered & Paginated records
  const filteredRequests = useMemo(() => {
    return leaveRequests.filter((req) => {
      const emp = employees[req.employeeId];
      const fullName = emp ? `${emp.firstName} ${emp.lastName}`.toLowerCase() : "";
      const matchesSearch =
        fullName.includes(searchQuery.toLowerCase()) ||
        req.leaveType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (req.reason && req.reason.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" ||
        req.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [leaveRequests, employees, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredRequests.length / limit) || 1;
  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredRequests.slice(start, start + limit);
  }, [filteredRequests, page, limit]);

  // Counts
  const pendingCount = leaveRequests.filter((r) => r.status?.toLowerCase() === "pending").length;
  const approvedCount = leaveRequests.filter((r) => r.status?.toLowerCase() === "approved").length;
  const rejectedCount = leaveRequests.filter((r) => r.status?.toLowerCase() === "rejected").length;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
            <FileCheck2 className="size-7 text-primary" />
            Leave Approvals
          </h1>
          <p className="text-sm text-muted-foreground">
            Review and process employee leave requests and time-off applications.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="gap-1.5 w-fit"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Pending Review</span>
              <Clock className="size-4 text-amber-500" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-amber-600 dark:text-amber-400">
              {pendingCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Requires manager action
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Approved</span>
              <CheckCircle2 className="size-4 text-emerald-500" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{approvedCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-emerald-600 font-medium">
            Authorized time-off
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Rejected</span>
              <XCircle className="size-4 text-rose-500" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{rejectedCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Declined requests
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Total Requests</span>
              <Calendar className="size-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{leaveRequests.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            All time applications
          </CardContent>
        </Card>
      </div>

      {/* Requests Table Card */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Approval Requests</CardTitle>
            <CardDescription>
              Click approve or reject to update employee leave status in real time.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search employee or type..."
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
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
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
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-primary" />
                      Loading leave requests...
                    </TableCell>
                  </TableRow>
                ) : paginatedRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      No leave requests found matching the criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRequests.map((req) => {
                    const emp = employees[req.employeeId];
                    const empName = emp ? `${emp.firstName} ${emp.lastName}` : `Employee #${req.employeeId}`;
                    const isPending = req.status?.toLowerCase() === "pending";
                    const isApproved = req.status?.toLowerCase() === "approved";

                    return (
                      <TableRow key={req.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          #{req.id}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{empName}</span>
                            {emp && <span className="text-xs text-muted-foreground">{emp.email}</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {req.leaveType}
                          </Badge>
                        </TableCell>
                        <TableCell className="tabular-nums text-sm">
                          {new Date(req.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
                          {new Date(req.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {req.reason || "No reason provided"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={isPending ? "secondary" : isApproved ? "default" : "destructive"}
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
                                disabled={actionLoadingId === req.id}
                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                onClick={() => handleApprove(req.id)}
                              >
                                <CheckCircle2 className="size-3.5" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={actionLoadingId === req.id}
                                className="h-7 text-xs text-rose-600 hover:bg-rose-50 border-rose-200 gap-1"
                                onClick={() => handleReject(req.id)}
                              >
                                <XCircle className="size-3.5" />
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
