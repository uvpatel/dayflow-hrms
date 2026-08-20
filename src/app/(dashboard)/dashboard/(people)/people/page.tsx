"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Users,
  UserPlus,
  Search,
  Building2,
  Mail,
  Phone,
  Calendar,
  RefreshCw,
  Plus,
  ChevronLeft,
  ChevronRight,
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

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  createdAt: string;
}

export default function PeoplePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Add Employee Form State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/employees?limit=100${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setEmployees(data.data);
        }
      }
    } catch (err) {
      console.error("Failed to load employees:", err);
      toast.error("Failed to fetch employee directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [searchQuery]);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await fetch("/api/v1/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phoneNumber,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Employee ${firstName} ${lastName} created!`);
        setIsAddOpen(false);
        setFirstName("");
        setLastName("");
        setEmail("");
        setPhoneNumber("");
        fetchEmployees();
      } else {
        toast.error(data.error || "Failed to create employee");
      }
    } catch (err) {
      toast.error("Failed to submit employee data");
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(employees.length / limit) || 1;
  const paginatedEmployees = useMemo(() => {
    const start = (page - 1) * limit;
    return employees.slice(start, start + limit);
  }, [employees, page, limit]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
            <SiteHeader />
            <Users className="size-7 text-primary" />
            People & Employee Directory
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage company employees, profiles, contact details, and organization structure.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEmployees}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Drawer open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DrawerTrigger>
              <Button size="sm" className="gap-1.5">
                <UserPlus className="size-4" />
                Add Employee
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <form onSubmit={handleCreateEmployee}>
                <DrawerHeader>
                  <DrawerTitle>New Employee Onboarding</DrawerTitle>
                  <DrawerDescription>
                    Add a new team member to your organization.
                  </DrawerDescription>
                </DrawerHeader>
                <div className="grid gap-4 p-4 max-w-md mx-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="e.g. Sarah"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="e.g. Connor"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Work Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="sarah@dayflow.app"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      required
                    />
                  </div>
                </div>
                <DrawerFooter className="max-w-md mx-auto w-full">
                  <Button type="submit" disabled={actionLoading}>
                    {actionLoading ? "Saving..." : "Create Employee"}
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

      {/* Directory Table Card */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Employees ({employees.length})</CardTitle>
            <CardDescription>
              Direct contact info and registration status.
            </CardDescription>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-8"
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Work Email</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-primary" />
                      Loading employees...
                    </TableCell>
                  </TableRow>
                ) : paginatedEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No employees found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedEmployees.map((emp) => (
                    <TableRow key={emp.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{emp.id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                            {emp.firstName.charAt(0)}
                            {emp.lastName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">
                              {emp.firstName} {emp.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">Active Team Member</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail className="size-3.5" />
                          {emp.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="size-3.5" />
                          {emp.phoneNumber}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground tabular-nums">
                        {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : "Just now"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-200">
                          Active
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
              Showing {employees.length > 0 ? (page - 1) * limit + 1 : 0} to{" "}
              {Math.min(page * limit, employees.length)} of {employees.length} employees
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
