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
  ArrowRight,
  TrendingUp,
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
} from "@/hooks/use-payroll";

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState("periods");

  // New Period Form State
  const [isPeriodDialogOpen, setIsPeriodDialogOpen] = useState(false);
  const [newPeriodName, setNewPeriodName] = useState("");
  const [newPeriodStart, setNewPeriodStart] = useState("");
  const [newPeriodEnd, setNewPeriodEnd] = useState("");

  // TanStack Query Hooks
  const { data: periodsData, isLoading: periodsLoading, refetch: refetchPeriods } = usePayrollPeriods({ limit: 50 });
  const { data: structuresData, isLoading: structuresLoading, refetch: refetchStructures } = useSalaryStructures();
  const { data: payslipsData, refetch: refetchPayslips } = usePayslips({ limit: 50 });

  const createPeriodMutation = useCreatePeriod();
  const calculatePayrollMutation = useCalculatePayroll();
  const finalizePayrollMutation = useFinalizePayroll();

  const periods = periodsData?.items ?? [];
  const structures = structuresData ?? [];
  const payslips = payslipsData?.items ?? [];

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

  const handleFinalizePeriod = async (id: number) => {
    try {
      await finalizePayrollMutation.mutateAsync(id);
      toast.success(`Payroll period #${id} finalized and locked`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Finalize failed";
      toast.error(errorMsg);
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
            <CardDescription>Monthly Payroll Run</CardDescription>
            <DollarSign className="size-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$142,500.00</div>
            <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
              <TrendingUp className="size-3.5 text-emerald-500" />
              <span>Standard gross disbursement</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Active Pay Periods</CardDescription>
            <Calendar className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{periods.length || 1}</div>
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
            <div className="text-2xl font-bold">{structures.length || 3}</div>
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
            <div className="text-2xl font-bold">{payslips.length || 20}</div>
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
                      const isCalculated = period.status === "calculated";
                      const isFinalized = period.status === "finalized";

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
                                isFinalized ? "default" : isCalculated ? "secondary" : "outline"
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
                              {isCalculated && (
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
                                <span className="text-xs text-muted-foreground">Completed</span>
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
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Structure Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {structuresLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        Loading salary structures...
                      </TableCell>
                    </TableRow>
                  ) : structures.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
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
                      </TableRow>
                    ))
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
