"use client";

import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Phone,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

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
import { useEmployees, useCreateEmployee } from "@/hooks/use-employees";
import { useMe } from "@/hooks/use-me";
import { normalizeRole } from "@/lib/permissions";

export default function PeoplePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const offset = (page - 1) * limit;

  // Add Employee Form State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const { data: employeesData, isLoading, refetch } = useEmployees({
    limit,
    offset,
    search: searchQuery,
  });
  const meQuery = useMe();

  const createEmployeeMutation = useCreateEmployee();
  const currentRole = normalizeRole(
    meQuery.data?.employee?.role ?? meQuery.data?.user.role,
  );
  const canCreateEmployee = currentRole === "admin" || currentRole === "hr";

  const employees = employeesData?.items ?? [];
  const total = employeesData?.total ?? 0;
  const totalPages = Math.ceil(total / limit) || 1;

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEmployeeMutation.mutateAsync({
        firstName,
        lastName,
        email,
        phoneNumber,
      });
      toast.success(`Employee ${firstName} ${lastName} onboarded successfully!`);
      setIsAddOpen(false);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhoneNumber("");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create employee";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
            <Users className="size-7 text-primary" />
            People &amp; Employee Directory
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage company employees, profiles, contact details, and organization structure.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetch();
              toast.success("Employee directory refreshed");
            }}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {canCreateEmployee ? (
            <Drawer open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DrawerTrigger>
                <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground">
                  <UserPlus className="size-4" />
                  Add Employee
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <form onSubmit={handleCreateEmployee}>
                  <DrawerHeader>
                    <DrawerTitle>New Employee Onboarding</DrawerTitle>
                    <DrawerDescription>
                      Add a new team member to your Dayflow organization.
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
                          placeholder="e.g. Jenkins"
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
                        placeholder="sarah@dayflow.dev"
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
                        placeholder="+1 (555) 010-0002"
                        required
                      />
                    </div>
                  </div>
                  <DrawerFooter className="max-w-md mx-auto w-full">
                    <Button type="submit" disabled={createEmployeeMutation.isPending}>
                      {createEmployeeMutation.isPending ? "Saving..." : "Create Employee"}
                    </Button>
                    <DrawerClose>
                      <Button variant="outline">Cancel</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </form>
              </DrawerContent>
            </Drawer>
          ) : null}
        </div>
      </div>

      {/* Directory Table Card */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Employees ({total})</CardTitle>
            <CardDescription>
              Direct contact info, roles, and employment profiles.
            </CardDescription>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email..."
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
                  <TableHead className="w-[100px]">Emp No</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Work Email</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-primary" />
                      Loading employee directory...
                    </TableCell>
                  </TableRow>
                ) : employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      No employees found matching criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((emp) => (
                    <TableRow key={emp.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {emp.employeeNumber || `#${emp.id}`}
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
                            <div className="text-xs text-muted-foreground capitalize">
                              {emp.employmentType?.replace("_", " ") || "Full Time"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs">
                          {emp.role}
                        </Badge>
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
                          {emp.phoneNumber || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`capitalize ${emp.employmentStatus === "active"
                              ? "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400"
                              : "bg-muted text-muted-foreground"
                            }`}
                        >
                          {emp.employmentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Link href={`/dashboard/people/${emp.id}`}>
                            <Eye className="size-4" />
                            <span className="sr-only">View profile</span>
                          </Link>
                        </Button>
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
              Showing {total > 0 ? offset + 1 : 0} to{" "}
              {Math.min(offset + limit, total)} of {total} employees
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
