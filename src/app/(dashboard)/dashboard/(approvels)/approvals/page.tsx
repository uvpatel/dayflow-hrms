"use client";

import React, { useEffect, useState, useTransition } from "react";
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

interface AttendanceCorrection {
  id: number;
  employeeId: number;
  attendanceId: number;
  reason: string;
  status: string;
  createdAt?: string;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export default function ApprovalsPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>([]);
  const [employees, setEmployees] = useState<Record<number, Employee>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("leave");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [, startTransition] = useTransition();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leaveRes, corrRes, empRes] = await Promise.all([
        fetch("/api/v1/leave-requests?limit=50"),
        fetch("/api/v1/attendance/corrections?limit=50"),
        fetch("/api/v1/employees?limit=100"),
      ]);

      if (leaveRes.ok) {
        const json = await leaveRes.json();
        if (json.success && Array.isArray(json.data)) setLeaveRequests(json.data);
      }

      if (corrRes.ok) {
        const json = await corrRes.json();
        if (json.success && Array.isArray(json.data)) setCorrections(json.data);
      }

      if (empRes.ok) {
        const json = await empRes.json();
        if (json.success && Array.isArray(json.data)) {
          const map: Record<number, Employee> = {};
          json.data.forEach((emp: Employee) => {
            map[emp.id] = emp;
          });
          setEmployees(map);
        }
      }
    } catch {
      toast.error("Failed to load approvals queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveLeave = async (id: number) => {
    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/v1/leave-requests/${id}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Leave request #${id} approved successfully!`);
        startTransition(() => {
          fetchData();
        });
      } else {
        toast.error(data.error?.message || data.error || "Failed to approve request");
      }
    } catch {
      toast.error("Network error processing approval");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectLeave = async (id: number) => {
    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/v1/leave-requests/${id}/reject`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Leave request #${id} rejected`);
        startTransition(() => {
          fetchData();
        });
      } else {
        toast.error(data.error?.message || data.error || "Failed to reject request");
      }
    } catch {
      toast.error("Network error processing rejection");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredLeave = leaveRequests.filter((req) => {
    const matchesStatus = statusFilter === "all" || req.status.toLowerCase() === statusFilter.toLowerCase();
    const emp = employees[req.employeeId];
    const name = emp ? `${emp.firstName} ${emp.lastName}`.toLowerCase() : "";
    const matchesSearch = !searchQuery || name.includes(searchQuery.toLowerCase()) || req.leaveType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredCorrections = corrections.filter((c) => {
    const matchesStatus = statusFilter === "all" || c.status.toLowerCase() === statusFilter.toLowerCase();
    const emp = employees[c.employeeId];
    const name = emp ? `${emp.firstName} ${emp.lastName}`.toLowerCase() : "";
    const matchesSearch = !searchQuery || name.includes(searchQuery.toLowerCase()) || c.reason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingLeaveCount = leaveRequests.filter((r) => r.status.toLowerCase() === "pending").length;
  const pendingCorrectionCount = corrections.filter((c) => c.status.toLowerCase() === "pending").length;

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
          onClick={fetchData}
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
            <CardDescription>Pending Attendance Corrections</CardDescription>
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
                          <TableCell className="text-sm">
                            {req.startDate} to {req.endDate}
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
                                  disabled={actionLoadingId === req.id}
                                >
                                  <CheckCircle2 className="size-3.5 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-destructive hover:bg-destructive/10 border-destructive/30"
                                  onClick={() => handleRejectLeave(req.id)}
                                  disabled={actionLoadingId === req.id}
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
                    <TableHead>Employee</TableHead>
                    <TableHead>Attendance ID</TableHead>
                    <TableHead>Reason / Notes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        Loading attendance corrections...
                      </TableCell>
                    </TableRow>
                  ) : filteredCorrections.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        No attendance correction requests found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCorrections.map((corr) => {
                      const emp = employees[corr.employeeId];
                      return (
                        <TableRow key={corr.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="size-7 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-semibold text-xs">
                                {emp ? emp.firstName[0] : <User className="size-3.5" />}
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {emp ? `${emp.firstName} ${emp.lastName}` : `Emp #${corr.employeeId}`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {emp?.email || ""}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-mono">
                            #{corr.attendanceId}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-sm truncate">
                            {corr.reason}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                corr.status.toLowerCase() === "approved"
                                  ? "default"
                                  : corr.status.toLowerCase() === "rejected"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="capitalize"
                            >
                              {corr.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-xs text-muted-foreground">Reviewed</span>
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
    </div>
  );
}
