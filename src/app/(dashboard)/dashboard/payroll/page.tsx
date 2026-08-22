"use client";

import React, { useEffect, useState } from "react";
import {
  Wallet,
  DollarSign,
  Calendar,
  Layers,
  Search,
  Plus,
  RefreshCw,
  Building2,
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

interface PayrollPeriod {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  totalGross?: string | null;
  totalNet?: string | null;
  createdAt?: string;
}

interface SalaryStructure {
  id: number;
  name: string;
  description?: string | null;
  baseSalary: string;
  currency: string;
  isActive: boolean;
}

interface Payslip {
  id: number;
  employeeId: number;
  periodId: number;
  grossPay: string;
  netPay: string;
  totalDeductions: string;
  status: string;
}

export default function PayrollPage() {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("periods");
  const [searchQuery, setSearchQuery] = useState("");

  // New Period Form State
  const [isPeriodDialogOpen, setIsPeriodDialogOpen] = useState(false);
  const [newPeriodName, setNewPeriodName] = useState("");
  const [newPeriodStart, setNewPeriodStart] = useState("");
  const [newPeriodEnd, setNewPeriodEnd] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [periodsRes, structRes, payslipsRes] = await Promise.all([
        fetch("/api/v1/payroll/periods?limit=50"),
        fetch("/api/v1/salary-structures?limit=50"),
        fetch("/api/v1/payroll/payslips?limit=50"),
      ]);

      if (periodsRes.ok) {
        const json = await periodsRes.json();
        if (json.success && Array.isArray(json.data)) setPeriods(json.data);
      }

      if (structRes.ok) {
        const json = await structRes.json();
        if (json.success && Array.isArray(json.data)) setStructures(json.data);
      }

      if (payslipsRes.ok) {
        const json = await payslipsRes.json();
        if (json.success && Array.isArray(json.data)) setPayslips(json.data);
      }
    } catch {
      toast.error("Failed to load payroll data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await fetch("/api/v1/payroll/periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPeriodName,
          startDate: new Date(newPeriodStart),
          endDate: new Date(newPeriodEnd),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Payroll period created!");
        setIsPeriodDialogOpen(false);
        setNewPeriodName("");
        setNewPeriodStart("");
        setNewPeriodEnd("");
        fetchData();
      } else {
        toast.error(data.error?.message || data.error || "Failed to create period");
      }
    } catch {
      toast.error("Failed to create payroll period");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCalculatePeriod = async (periodId: number) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/v1/payroll/periods/${periodId}/calculate`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Payroll period #${periodId} calculated successfully!`);
        fetchData();
      } else {
        toast.error(data.error?.message || data.error || "Calculation failed");
      }
    } catch {
      toast.error("Failed to calculate payroll");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinalizePeriod = async (periodId: number) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/v1/payroll/periods/${periodId}/finalize`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Payroll period #${periodId} finalized and payslips locked!`);
        fetchData();
      } else {
        toast.error(data.error?.message || data.error || "Finalization failed");
      }
    } catch {
      toast.error("Failed to finalize payroll");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Wallet className="size-7 text-primary" />
            Payroll & Compensation
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage payroll calculation periods, salary structures, and employee payslips.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Dialog open={isPeriodDialogOpen} onOpenChange={setIsPeriodDialogOpen}>
            <DialogTrigger >
              <Button size="sm" className="gap-2">
                <Plus className="size-4" />
                <span>New Pay Period</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreatePeriod}>
                <DialogHeader>
                  <DialogTitle>Create Payroll Period</DialogTitle>
                  <DialogDescription>
                    Define a new monthly or bi-weekly pay cycle for calculation.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="periodName">Cycle Name</Label>
                    <Input
                      id="periodName"
                      placeholder="e.g. August 2026 Monthly Payroll"
                      value={newPeriodName}
                      onChange={(e) => setNewPeriodName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={newPeriodStart}
                        onChange={(e) => setNewPeriodStart(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={newPeriodEnd}
                        onChange={(e) => setNewPeriodEnd(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={actionLoading}>
                    {actionLoading ? "Creating..." : "Create Period"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Active Pay Periods</span>
              <Calendar className="size-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{periods.length}</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-xs text-muted-foreground">
              {periods.filter((p) => p.status === "finalized").length} finalized cycles
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Salary Structures</span>
              <Layers className="size-4 text-emerald-500" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{structures.length}</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-xs text-muted-foreground">
              {structures.filter((s) => s.isActive).length} active salary configurations
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Generated Payslips</span>
              <DollarSign className="size-4 text-blue-500" />
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{payslips.length}</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-xs text-muted-foreground">
              Across all processed payroll runs
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full sm:w-96 grid-cols-2">
          <TabsTrigger value="periods" className="gap-2">
            <Calendar className="size-4" />
            <span>Pay Cycles ({periods.length})</span>
          </TabsTrigger>
          <TabsTrigger value="structures" className="gap-2">
            <Layers className="size-4" />
            <span>Salary Structures ({structures.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Pay Cycles Tab */}
        <TabsContent value="periods">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cycle Name</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Gross Pay</TableHead>
                    <TableHead>Net Pay</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Loading payroll cycles...
                      </TableCell>
                    </TableRow>
                  ) : periods.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No payroll periods created yet. Click "New Pay Period" to begin.
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
                            {new Date(period.startDate).toLocaleDateString()} – {new Date(period.endDate).toLocaleDateString()}
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
                          <TableCell className="tabular-nums font-mono text-sm">
                            ${period.totalGross || "0.00"}
                          </TableCell>
                          <TableCell className="tabular-nums font-mono text-sm font-semibold text-emerald-600">
                            ${period.totalNet || "0.00"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isDraft && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCalculatePeriod(period.id)}
                                  disabled={actionLoading}
                                >
                                  Calculate
                                </Button>
                              )}
                              {isCalculated && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleFinalizePeriod(period.id)}
                                  disabled={actionLoading}
                                  className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                                >
                                  <Lock className="size-3.5" />
                                  Finalize & Lock
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
                    <TableHead>Base Salary</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
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
                          {struct.description || "Standard compensation breakdown"}
                        </TableCell>
                        <TableCell className="tabular-nums font-mono font-semibold">
                          ${struct.baseSalary}
                        </TableCell>
                        <TableCell className="text-xs font-mono uppercase">
                          {struct.currency || "USD"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={struct.isActive ? "default" : "secondary"}>
                            {struct.isActive ? "Active" : "Archived"}
                          </Badge>
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
