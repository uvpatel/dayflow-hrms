"use client";

import React, { useState } from "react";
import {
  Wallet,
  DollarSign,
  Calendar,
  Layers,
  Plus,
  RefreshCw,
  Lock,
  Send,
  ArrowRight,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  usePayrollPeriods,
  useSalaryStructures,
  usePayslips,
  useCreatePeriod,
  useCalculatePayroll,
  useFinalizePayroll,
  usePublishPayroll,
  useCreatePayslip,
  useCreateSalaryStructure,
  useMyPayslips,
  useUpdateSalaryStructure,
} from "@/hooks/use-payroll";
import { useEmployees } from "@/hooks/use-employees";
import { useMe } from "@/hooks/use-me";
import { normalizeRole } from "@/lib/permissions";

export default function PayrollPage({ initialTab = "periods" }: { initialTab?: "periods" | "structures" }) {
  const meQuery = useMe();
  const role = normalizeRole(
    meQuery.data?.employee?.role ?? meQuery.data?.user.role,
  );

  if (meQuery.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        Loading payroll access…
      </div>
    );
  }

  if (meQuery.isError || !meQuery.data) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 md:p-6 lg:p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Payroll is temporarily unavailable</CardTitle>
            <CardDescription>
              We could not verify your payroll access. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => void meQuery.refetch()} className="gap-1.5">
              <RefreshCw className="size-4" />
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (role === "hr" || role === "admin") {
    return <PayrollManagementWorkspace initialTab={initialTab} />;
  }

  return <MyPayslipsWorkspace />;
}

function PayrollManagementWorkspace({ initialTab }: { initialTab: "periods" | "structures" }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  // New Period Form State
  const [isPeriodDialogOpen, setIsPeriodDialogOpen] = useState(false);
  const [newPeriodName, setNewPeriodName] = useState("");
  const [newPeriodStart, setNewPeriodStart] = useState("");
  const [newPeriodEnd, setNewPeriodEnd] = useState("");
  const [isPayslipDialogOpen, setIsPayslipDialogOpen] = useState(false);
  const [payslipEmployeeId, setPayslipEmployeeId] = useState("");
  const [payslipPeriodId, setPayslipPeriodId] = useState("");
  const [payslipBasic, setPayslipBasic] = useState("");
  const [payslipGross, setPayslipGross] = useState("");
  const [payslipDeductions, setPayslipDeductions] = useState("0.00");
  const [isStructureDialogOpen, setIsStructureDialogOpen] = useState(false);
  const [editingStructureId, setEditingStructureId] = useState<number | null>(null);
  const [structureName, setStructureName] = useState("");
  const [structureDescription, setStructureDescription] = useState("");

  // TanStack Query Hooks
  const { data: periodsData, isLoading: periodsLoading, refetch: refetchPeriods } = usePayrollPeriods({ limit: 50 });
  const { data: structuresData, isLoading: structuresLoading, refetch: refetchStructures } = useSalaryStructures();
  const { data: payslipsData, refetch: refetchPayslips } = usePayslips({ limit: 50 });
  const { data: employeesData } = useEmployees({ limit: 500 });

  const createPeriodMutation = useCreatePeriod();
  const calculatePayrollMutation = useCalculatePayroll();
  const finalizePayrollMutation = useFinalizePayroll();
  const publishPayrollMutation = usePublishPayroll();
  const createPayslipMutation = useCreatePayslip();
  const createStructureMutation = useCreateSalaryStructure();
  const updateStructureMutation = useUpdateSalaryStructure();

  const periods = periodsData?.items ?? [];
  const structures = structuresData ?? [];
  const payslips = payslipsData?.items ?? [];
  const employees = employeesData?.items ?? [];
  const publishedNetPayroll = payslips
    .filter((payslip) => payslip.status === "published")
    .reduce((total, payslip) => total + Number(payslip.netSalary ?? 0), 0);

  const handleRefresh = () => {
    refetchPeriods();
    refetchStructures();
    refetchPayslips();
    toast.success("Payroll data synchronized");
  };

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPeriodName.trim()) {
      toast.error("Please provide a period name");
      return;
    }

    try {
      await createPeriodMutation.mutateAsync({
        name: newPeriodName.trim(),
        description: `Payroll cycle for ${newPeriodName}`,
        ...(newPeriodStart && { startDate: newPeriodStart }),
        ...(newPeriodEnd && { endDate: newPeriodEnd }),
      });
      toast.success("Payroll period created successfully!");
      setIsPeriodDialogOpen(false);
      setNewPeriodName("");
      setNewPeriodStart("");
      setNewPeriodEnd("");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create payroll period";
      toast.error(errorMsg);
    }
  };

  const handleCalculatePeriod = async (id: number) => {
    try {
      await calculatePayrollMutation.mutateAsync(id);
      toast.success(`Calculated payroll for cycle #${id}`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Calculation failed";
      toast.error(errorMsg);
    }
  };

  const handleCreatePayslip = async (event: React.FormEvent) => {
    event.preventDefault();
    const employeeId = Number(payslipEmployeeId);
    const payrollPeriodId = Number(payslipPeriodId);
    if (!employeeId || !payrollPeriodId || !payslipGross) {
      toast.error("Select an employee and draft period, then enter gross salary");
      return;
    }

    try {
      await createPayslipMutation.mutateAsync({
        employeeId,
        payrollPeriodId,
        grossSalary: payslipGross,
        deductions: payslipDeductions || "0.00",
        ...(payslipBasic && { basicSalary: payslipBasic }),
      });
      toast.success("Draft payslip created with server-calculated net pay");
      setIsPayslipDialogOpen(false);
      setPayslipEmployeeId("");
      setPayslipPeriodId("");
      setPayslipBasic("");
      setPayslipGross("");
      setPayslipDeductions("0.00");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not create payslip");
    }
  };

  const openStructureDialog = (structure?: (typeof structures)[number]) => {
    setEditingStructureId(structure?.id ?? null);
    setStructureName(structure?.name ?? "");
    setStructureDescription(structure?.description ?? "");
    setIsStructureDialogOpen(true);
  };

  const handleSaveStructure = async (event: React.FormEvent) => {
    event.preventDefault();
    if (structureName.trim().length < 2) {
      toast.error("Structure name must contain at least two characters");
      return;
    }
    try {
      if (editingStructureId) {
        await updateStructureMutation.mutateAsync({
          id: editingStructureId,
          name: structureName.trim(),
          description: structureDescription.trim(),
        });
        toast.success("Salary structure updated");
      } else {
        await createStructureMutation.mutateAsync({
          name: structureName.trim(),
          description: structureDescription.trim(),
        });
        toast.success("Salary structure created");
      }
      setIsStructureDialogOpen(false);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Could not save salary structure",
      );
    }
  };

  const handleFinalizePeriod = async (id: number) => {
    try {
      await finalizePayrollMutation.mutateAsync(id);
      toast.success(`Payroll period #${id} finalized and locked`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Finalize failed";
      toast.error(errorMsg);
    }
  };

  const handlePublishPeriod = async (id: number) => {
    try {
      await publishPayrollMutation.mutateAsync(id);
      toast.success(`Payroll period #${id} published to employees`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Publish failed");
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Payroll &amp; Compensation
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage salary structures, pay periods, and employee payslips with audit precision.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-1.5">
            <RefreshCw className="size-4" />
            Refresh
          </Button>

          <Dialog open={isPayslipDialogOpen} onOpenChange={setIsPayslipDialogOpen}>
            <DialogTrigger>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Wallet className="size-4" />
                New Payslip
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreatePayslip}>
                <DialogHeader>
                  <DialogTitle>Create Draft Payslip</DialogTitle>
                  <DialogDescription>
                    Net pay is derived by the server. Drafts must be calculated,
                    finalized, and published before employees can see them.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="payslip-employee">Employee</Label>
                    <Select value={payslipEmployeeId} onValueChange={(value) => setPayslipEmployeeId(value ?? "")}>
                      <SelectTrigger id="payslip-employee">
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id.toString()}>
                            {employee.firstName} {employee.lastName} ({employee.employeeNumber ?? employee.id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="payslip-period">Draft pay period</Label>
                    <Select value={payslipPeriodId} onValueChange={(value) => setPayslipPeriodId(value ?? "")}>
                      <SelectTrigger id="payslip-period">
                        <SelectValue placeholder="Select draft period" />
                      </SelectTrigger>
                      <SelectContent>
                        {periods
                          .filter((period) => period.status === "draft")
                          .map((period) => (
                            <SelectItem key={period.id} value={period.id.toString()}>
                              {period.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="grid gap-2">
                      <Label htmlFor="payslip-basic">Basic</Label>
                      <Input id="payslip-basic" inputMode="decimal" value={payslipBasic} onChange={(event) => setPayslipBasic(event.target.value)} placeholder="7500.00" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="payslip-gross">Gross</Label>
                      <Input id="payslip-gross" inputMode="decimal" value={payslipGross} onChange={(event) => setPayslipGross(event.target.value)} placeholder="9200.00" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="payslip-deductions">Deductions</Label>
                      <Input id="payslip-deductions" inputMode="decimal" value={payslipDeductions} onChange={(event) => setPayslipDeductions(event.target.value)} required />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsPayslipDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createPayslipMutation.isPending}>
                    {createPayslipMutation.isPending ? "Creating…" : "Create draft"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isPeriodDialogOpen} onOpenChange={setIsPeriodDialogOpen}>
            <DialogTrigger  >
              <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground">
                <Plus className="size-4" />
                New Pay Period
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreatePeriod}>
                <DialogHeader>
                  <DialogTitle>Create Payroll Period</DialogTitle>
                  <DialogDescription>
                    Define a new calculation cycle for employee compensations and statutory deductions.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="period-name">Period Name</Label>
                    <Input
                      id="period-name"
                      placeholder="e.g. September 2026"
                      value={newPeriodName}
                      onChange={(e) => setNewPeriodName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="period-start">Start Date</Label>
                      <Input
                        id="period-start"
                        type="date"
                        value={newPeriodStart}
                        onChange={(e) => setNewPeriodStart(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="period-end">End Date</Label>
                      <Input
                        id="period-end"
                        type="date"
                        value={newPeriodEnd}
                        onChange={(e) => setNewPeriodEnd(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsPeriodDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createPeriodMutation.isPending}>
                    {createPeriodMutation.isPending ? "Creating..." : "Create Period"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Published Net Payroll</CardDescription>
            <DollarSign className="size-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: "USD",
              }).format(publishedNetPayroll)}
            </div>
            <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
              <span>Visible to employees after publication</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Active Pay Periods</CardDescription>
            <Calendar className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {periods.filter((period) => period.status !== "published").length}
            </div>
            <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
              <span>{periods.filter((p) => p.status === "draft").length} in draft status</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Salary Structures</CardDescription>
            <Layers className="size-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{structures.length}</div>
            <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
              <Link href="/dashboard/payroll/salary-structures" className="text-primary hover:underline flex items-center gap-1">
                <span>Manage structures</span>
                <ArrowRight className="size-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Generated Payslips</CardDescription>
            <Wallet className="size-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payslips.length}</div>
            <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
              <span>Ready for download &amp; preview</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Layout */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="periods">Payroll Cycles</TabsTrigger>
          <TabsTrigger value="structures">Salary Structures</TabsTrigger>
        </TabsList>

        {/* Periods Tab */}
        <TabsContent value="periods" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Payroll Periods</CardTitle>
                <CardDescription>
                  Calculate and finalize monthly payroll batches.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cycle Name</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periodsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        Loading payroll cycles...
                      </TableCell>
                    </TableRow>
                  ) : periods.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        No payroll periods created yet. Click &quot;New Pay Period&quot; to begin.
                      </TableCell>
                    </TableRow>
                  ) : (
                    periods.map((period) => {
                      const isDraft = period.status === "draft";
                      const isReview = period.status === "review";
                      const isFinalized = period.status === "finalized";
                      const isPublished = period.status === "published";

                      return (
                        <TableRow key={period.id}>
                          <TableCell className="font-medium text-foreground">
                            {period.name}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground tabular-nums">
                            {period.startDate ? new Date(period.startDate).toLocaleDateString() : "Auto"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground tabular-nums">
                            {period.endDate ? new Date(period.endDate).toLocaleDateString() : "Auto"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                isPublished || isFinalized
                                  ? "default"
                                  : isReview
                                    ? "secondary"
                                    : "outline"
                              }
                              className="capitalize"
                            >
                              {period.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isDraft && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCalculatePeriod(period.id)}
                                  disabled={calculatePayrollMutation.isPending}
                                >
                                  Calculate
                                </Button>
                              )}
                              {isReview && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleFinalizePeriod(period.id)}
                                  disabled={finalizePayrollMutation.isPending}
                                  className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  <Lock className="size-3.5" />
                                  Finalize &amp; Lock
                                </Button>
                              )}
                              {isFinalized && (
                                <Button
                                  size="sm"
                                  onClick={() => handlePublishPeriod(period.id)}
                                  disabled={publishPayrollMutation.isPending}
                                  className="gap-1"
                                >
                                  <Send className="size-3.5" />
                                  Publish to employees
                                </Button>
                              )}
                              {isPublished && (
                                <span className="text-xs text-muted-foreground">Published</span>
                              )}
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

        {/* Salary Structures Tab */}
        <TabsContent value="structures">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Salary Structures</CardTitle>
                <CardDescription>
                  Maintain the compensation structures available to this organization.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => openStructureDialog()}>
                <Plus className="mr-1 size-4" />
                New Structure
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Structure Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {structuresLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        Loading salary structures...
                      </TableCell>
                    </TableRow>
                  ) : structures.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        No salary structures configured yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    structures.map((struct) => (
                      <TableRow key={struct.id}>
                        <TableCell className="font-medium text-foreground">
                          {struct.name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {struct.description || "Standard compensation structure"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {struct.createdAt ? new Date(struct.createdAt).toLocaleDateString() : "Configured"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">Active</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openStructureDialog(struct)}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isStructureDialogOpen} onOpenChange={setIsStructureDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSaveStructure}>
            <DialogHeader>
              <DialogTitle>
                {editingStructureId ? "Edit Salary Structure" : "New Salary Structure"}
              </DialogTitle>
              <DialogDescription>
                Structure records are isolated to your organization.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="structure-name">Name</Label>
                <Input
                  id="structure-name"
                  value={structureName}
                  onChange={(event) => setStructureName(event.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="structure-description">Description</Label>
                <Input
                  id="structure-description"
                  value={structureDescription}
                  onChange={(event) => setStructureDescription(event.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsStructureDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createStructureMutation.isPending || updateStructureMutation.isPending}
              >
                {createStructureMutation.isPending || updateStructureMutation.isPending
                  ? "Saving…"
                  : "Save structure"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MyPayslipsWorkspace() {
  const payslipsQuery = useMyPayslips();
  const payslips = payslipsQuery.data ?? [];
  const totalNetPay = payslips.reduce(
    (total, payslip) => total + Number(payslip.netSalary ?? 0),
    0,
  );
  const mostRecentPayslip = payslips[0];

  const formatMoney = (value: string | null) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(value ?? 0));

  const getPeriodLabel = (payslip: (typeof payslips)[number]) => {
    if (payslip.name?.trim()) return payslip.name;
    if (payslip.month && payslip.year) return `${payslip.month} ${payslip.year}`;
    if (payslip.createdAt) {
      return new Date(payslip.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }
    return `Payslip #${payslip.id}`;
  };

  if (payslipsQuery.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        Loading your published payslips…
      </div>
    );
  }

  if (payslipsQuery.isError) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 md:p-6 lg:p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Your payslips are temporarily unavailable</CardTitle>
            <CardDescription>
              We could not load your published payroll records. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => void payslipsQuery.refetch()}
              className="gap-1.5"
            >
              <RefreshCw className="size-4" />
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            My Payslips
          </h1>
          <p className="text-sm text-muted-foreground">
            View payroll that has been finalized and published to you.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void payslipsQuery.refetch()}
          disabled={payslipsQuery.isFetching}
          className="gap-1.5"
        >
          <RefreshCw
            className={`size-4 ${payslipsQuery.isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Published payslips</CardDescription>
            <Wallet className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payslips.length}</div>
            <p className="pt-1 text-xs text-muted-foreground">
              Only finalized payroll is visible here.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Total published net pay</CardDescription>
            <DollarSign className="size-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMoney(totalNetPay.toFixed(2))}
            </div>
            <p className="pt-1 text-xs text-muted-foreground">
              {mostRecentPayslip
                ? `Latest: ${getPeriodLabel(mostRecentPayslip)}`
                : "No published payroll yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Published payroll history</CardTitle>
          <CardDescription>
            Draft and in-progress payroll records are intentionally not shown.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pay period</TableHead>
                <TableHead>Gross pay</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net pay</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslips.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-sm text-muted-foreground"
                  >
                    No published payslips are available yet.
                  </TableCell>
                </TableRow>
              ) : (
                payslips.map((payslip) => (
                  <TableRow key={payslip.id}>
                    <TableCell className="font-medium">
                      {getPeriodLabel(payslip)}
                    </TableCell>
                    <TableCell>{formatMoney(payslip.grossSalary)}</TableCell>
                    <TableCell>{formatMoney(payslip.deductions)}</TableCell>
                    <TableCell className="font-semibold">
                      {formatMoney(payslip.netSalary)}
                    </TableCell>
                    <TableCell>
                      <Badge className="capitalize">{payslip.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
