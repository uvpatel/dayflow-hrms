"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  User,
  Building2,
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  ArrowLeft,
  Edit,
  RefreshCw,
  ShieldCheck,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEmployee, useUpdateEmployee } from "@/hooks/use-employees";
import { useMe } from "@/hooks/use-me";
import { useEmployeeAttendance } from "@/hooks/use-attendance";
import { useEmployeeTimeOff } from "@/hooks/use-leave";
import { useEmployeePayslips } from "@/hooks/use-payroll";
import {
  useDepartments,
  useDesignations,
  useLocations,
  useWorkSchedules,
} from "@/hooks/use-organization";
import { normalizeRole } from "@/lib/permissions";

function formatMoney(value: string | null) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value ?? 0));
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = Number(params?.employeeId);

  const [activeTab, setActiveTab] = useState("overview");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Edit form state
  const [editPhone, setEditPhone] = useState("");
  const [editStatus, setEditStatus] = useState("active");
  const [editType, setEditType] = useState("full_time");

  const meQuery = useMe();
  const { data: employee, isLoading, refetch } = useEmployee(employeeId);
  const currentRole = normalizeRole(
    meQuery.data?.employee?.role ?? meQuery.data?.user.role,
  );
  const isHRorAdmin = currentRole === "hr" || currentRole === "admin";
  const isSelf = meQuery.data?.employee?.id === employeeId;
  const canViewPayroll = isHRorAdmin || isSelf;
  const attendanceQuery = useEmployeeAttendance(employeeId);
  const timeOffQuery = useEmployeeTimeOff(employeeId);
  const payslipsQuery = useEmployeePayslips(employeeId, {
    enabled: canViewPayroll,
  });
  const departmentsQuery = useDepartments();
  const designationsQuery = useDesignations();
  const locationsQuery = useLocations();
  const schedulesQuery = useWorkSchedules(employeeId, {
    enabled: Boolean(employeeId),
  });

  const updateMutation = useUpdateEmployee();

  const handleOpenEdit = () => {
    if (employee) {
      setEditPhone(employee.phoneNumber || "");
      setEditStatus(employee.employmentStatus || "active");
      setEditType(employee.employmentType || "full_time");
      setIsEditDialogOpen(true);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({
        id: employeeId,
        data: {
          phoneNumber: editPhone,
          ...(isHRorAdmin ? { employmentStatus: editStatus, employmentType: editType } : {}),
        },
      });
      toast.success("Employee profile updated successfully!");
      setIsEditDialogOpen(false);
      refetch();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update employee";
      toast.error(errorMsg);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <RefreshCw className="size-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Loading employee profile #{employeeId}...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 p-6">
        <h2 className="text-xl font-bold">Employee Not Found</h2>
        <p className="text-sm text-muted-foreground">The requested employee record does not exist or you do not have permission to view it.</p>
        <Button variant="outline" onClick={() => router.push("/dashboard/people")} className="gap-2">
          <ArrowLeft className="size-4" />
          Back to Directory
        </Button>
      </div>
    );
  }

  const attendances = attendanceQuery.data ?? [];
  const leaves = timeOffQuery.data?.requests ?? [];
  const payslips = payslipsQuery.data ?? [];
  const department = departmentsQuery.data?.find(
    (item) => item.id === employee.departmentId,
  );
  const designation = designationsQuery.data?.find(
    (item) => item.id === employee.designationId,
  );
  const location = locationsQuery.data?.find(
    (item) => item.id === employee.locationId,
  );
  const schedule = schedulesQuery.data?.[0];

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Top Breadcrumb / Back Action */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/people")}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Employee Directory
        </Button>

        {isHRorAdmin && (
          <Button size="sm" onClick={handleOpenEdit} className="gap-1.5">
            <Edit className="size-4" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Header Profile Hero Card */}
      <Card className="overflow-hidden border-primary/20 bg-linear-to-r from-primary/5 via-card to-card">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl ring-2 ring-primary/20">
                {employee.firstName.charAt(0)}
                {employee.lastName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    {employee.firstName} {employee.lastName}
                  </h1>
                  <Badge variant="outline" className="capitalize text-xs">
                    {employee.role}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`capitalize ${
                      employee.employmentStatus === "active"
                        ? "bg-emerald-500/10 text-emerald-700 border-emerald-200"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {employee.employmentStatus}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                  <span>{employee.employeeNumber || `#${employee.id}`}</span>
                  <span>•</span>
                  <span>{employee.email}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="size-3.5 text-primary" />
                <span>
                  Joined {employee.joiningDate
                    ? new Date(employee.joiningDate).toLocaleDateString()
                    : "Not recorded"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Multi-Tab Workspace */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="job">Job &amp; Org</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leave">Time Off</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="size-4 text-primary" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-2 border-b pb-2">
                  <span className="text-muted-foreground">Full Name:</span>
                  <span className="font-medium">{employee.firstName} {employee.lastName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b pb-2">
                  <span className="text-muted-foreground">Work Email:</span>
                  <span className="font-medium">{employee.email}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b pb-2">
                  <span className="text-muted-foreground">Phone Number:</span>
                  <span className="font-medium">{employee.phoneNumber || "Not provided"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b pb-2">
                  <span className="text-muted-foreground">Employment Type:</span>
                  <span className="font-medium capitalize">{employee.employmentType?.replace("_", " ") || "Full Time"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-500" />
                  Workplace Credentials &amp; Access
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-2 border-b pb-2">
                  <span className="text-muted-foreground">System Role:</span>
                  <Badge variant="outline" className="w-fit capitalize">{employee.role}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b pb-2">
                  <span className="text-muted-foreground">Employee Code:</span>
                  <span className="font-mono">{employee.employeeNumber || `#${employee.id}`}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b pb-2">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="default" className="w-fit capitalize">{employee.employmentStatus}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 border-b pb-2">
                  <span className="text-muted-foreground">Auth Link:</span>
                  <span
                    className={
                      employee.userId
                        ? "font-medium text-emerald-600"
                        : "font-medium text-muted-foreground"
                    }
                  >
                    {employee.userId ? "Linked account" : "Awaiting account link"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Job & Org Tab */}
        <TabsContent value="job" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="size-4 text-primary" />
                Organizational Hierarchy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border bg-muted/20 space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="size-3.5" />
                    Department
                  </div>
                  <div className="font-semibold text-base">
                    {department?.name ?? "Not assigned"}
                  </div>
                </div>

                <div className="p-4 rounded-xl border bg-muted/20 space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Briefcase className="size-3.5" />
                    Designation
                  </div>
                  <div className="font-semibold text-base">
                    {designation?.name ?? "Not assigned"}
                  </div>
                </div>

                <div className="p-4 rounded-xl border bg-muted/20 space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    Location
                  </div>
                  <div className="font-semibold text-base">
                    {location?.name ?? "Not assigned"}
                  </div>
                </div>

                <div className="p-4 rounded-xl border bg-muted/20 space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3.5" />
                    Schedule
                  </div>
                  <div className="font-semibold text-base">
                    {schedulesQuery.isLoading
                      ? "Loading schedule…"
                      : schedule?.scheduleName ?? "Not assigned"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Attendance History</CardTitle>
              <CardDescription>Punches and duration logged for this employee</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y text-sm">
                {attendanceQuery.isLoading ? (
                  <div className="p-6 text-center text-muted-foreground">
                    Loading attendance history…
                  </div>
                ) : attendanceQuery.isError ? (
                  <button
                    type="button"
                    onClick={() => void attendanceQuery.refetch()}
                    className="w-full p-6 text-left text-destructive"
                  >
                    Attendance history could not be loaded. Select to retry.
                  </button>
                ) : attendances.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    No attendance records found.
                  </div>
                ) : (
                  attendances.slice(0, 5).map((att) => (
                    <div key={att.id} className="flex items-center justify-between p-4">
                      <div>
                        <div className="font-medium">
                          {att.workDate ??
                            (att.date
                              ? new Date(att.date).toLocaleDateString()
                              : "Recent")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {att.checkInTime
                            ? new Date(att.checkInTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "--:--"}
                          {" – "}
                          {att.checkOutTime
                            ? new Date(att.checkOutTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "--:--"}
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {att.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Tab */}
        <TabsContent value="leave" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Time Off Records</CardTitle>
              <CardDescription>Submitted leave requests</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y text-sm">
                {timeOffQuery.isLoading ? (
                  <div className="p-6 text-center text-muted-foreground">
                    Loading time-off records…
                  </div>
                ) : timeOffQuery.isError ? (
                  <button
                    type="button"
                    onClick={() => void timeOffQuery.refetch()}
                    className="w-full p-6 text-left text-destructive"
                  >
                    Time-off records could not be loaded. Select to retry.
                  </button>
                ) : leaves.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">No leave records found.</div>
                ) : (
                  leaves.map((l) => (
                    <div key={l.id} className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{l.leaveType}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant={l.status === "approved" ? "default" : "secondary"} className="capitalize">
                        {l.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payroll Tab */}
        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Compensation &amp; Payslips</CardTitle>
              <CardDescription>Monthly payroll statements</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y text-sm">
                {!canViewPayroll ? (
                  <div className="p-6 text-center text-muted-foreground">
                    Payroll details are visible only to the employee, HR, or an administrator.
                  </div>
                ) : payslipsQuery.isLoading ? (
                  <div className="p-6 text-center text-muted-foreground">
                    Loading published payroll records…
                  </div>
                ) : payslipsQuery.isError ? (
                  <button
                    type="button"
                    onClick={() => void payslipsQuery.refetch()}
                    className="w-full p-6 text-left text-destructive"
                  >
                    Payroll records could not be loaded. Select to retry.
                  </button>
                ) : payslips.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    No payslips found.
                  </div>
                ) : (
                  payslips.slice(0, 3).map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-4">
                      <div>
                        <div className="font-medium">
                          {p.name ??
                            (p.month && p.year
                              ? `${p.month} ${p.year}`
                              : `Payslip #${p.id}`)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Gross: {formatMoney(p.grossSalary)} | Net: {formatMoney(p.netSalary)}
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {p.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSaveEdit}>
            <DialogHeader>
              <DialogTitle>Edit Employee Profile</DialogTitle>
              <DialogDescription>
                Update contact and employment fields for {employee.firstName} {employee.lastName}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editPhone">Phone Number</Label>
                <Input
                  id="editPhone"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </div>

              {isHRorAdmin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="editStatus">Employment Status</Label>
                    <Input
                      id="editStatus"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editType">Employment Type</Label>
                    <Input
                      id="editType"
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
