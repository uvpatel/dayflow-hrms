"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Loader2,
  MapPin,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateEmployee, useEmployees } from "@/hooks/use-employees";
import { useMe } from "@/hooks/use-me";
import {
  useDepartments,
  useDesignations,
  useLocations,
} from "@/hooks/use-organization";
import { normalizeRole } from "@/lib/permissions";

const NO_SELECTION = "__none__";

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full time" },
  { value: "part_time", label: "Part time" },
  { value: "contract", label: "Contract" },
  { value: "intern", label: "Intern" },
] as const;

type ProvisionRole = "admin" | "hr" | "manager" | "employee";
type EmploymentType = (typeof EMPLOYMENT_TYPES)[number]["value"];

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function OnboardingSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6 lg:p-8">
      <div className="space-y-3 border-b pb-6">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.75fr)]">
        <Skeleton className="h-[38rem] w-full" />
        <Skeleton className="h-[24rem] w-full" />
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const meQuery = useMe();
  const departmentsQuery = useDepartments();
  const designationsQuery = useDesignations();
  const locationsQuery = useLocations();
  const managersQuery = useEmployees({ limit: 100, status: "active" });
  const onboardingQuery = useEmployees({ limit: 5, status: "onboarding" });
  const createEmployee = useCreateEmployee();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [departmentId, setDepartmentId] = useState(NO_SELECTION);
  const [designationId, setDesignationId] = useState(NO_SELECTION);
  const [managerId, setManagerId] = useState(NO_SELECTION);
  const [locationId, setLocationId] = useState(NO_SELECTION);
  const [role, setRole] = useState<ProvisionRole>("employee");
  const [employmentType, setEmploymentType] =
    useState<EmploymentType>("full_time");
  const [joiningDate, setJoiningDate] = useState(today);
  const [lastCreated, setLastCreated] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const currentRole = normalizeRole(
    meQuery.data?.employee?.role ?? meQuery.data?.user.role,
  );
  const canProvision = currentRole === "hr" || currentRole === "admin";
  const isAdmin = currentRole === "admin";
  const departments = departmentsQuery.data ?? [];
  const locations = locationsQuery.data ?? [];
  const onboardingEmployees = onboardingQuery.data?.items ?? [];
  const managers = useMemo(
    () =>
      (managersQuery.data?.items ?? []).filter(
        (employee) => employee.role === "manager",
      ),
    [managersQuery.data?.items],
  );
  const availableDesignations = useMemo(() => {
    const designations = designationsQuery.data ?? [];
    if (departmentId === NO_SELECTION) return designations;
    return designations.filter(
      (designation) => designation.departmentId === Number(departmentId),
    );
  }, [departmentId, designationsQuery.data]);

  const referenceError =
    departmentsQuery.isError ||
    designationsQuery.isError ||
    locationsQuery.isError ||
    managersQuery.isError;

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhoneNumber("");
    setEmployeeNumber("");
    setDepartmentId(NO_SELECTION);
    setDesignationId(NO_SELECTION);
    setManagerId(NO_SELECTION);
    setLocationId(NO_SELECTION);
    setRole("employee");
    setEmploymentType("full_time");
    setJoiningDate(today());
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedFirstName.length < 2 || normalizedLastName.length < 2) {
      toast.error("Enter a first and last name with at least two characters.");
      return;
    }

    if (!normalizedEmail) {
      toast.error("Enter a work email address.");
      return;
    }

    try {
      const created = await createEmployee.mutateAsync({
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        email: normalizedEmail,
        ...(phoneNumber.trim() ? { phoneNumber: phoneNumber.trim() } : {}),
        ...(employeeNumber.trim()
          ? { employeeNumber: employeeNumber.trim().toUpperCase() }
          : {}),
        ...(departmentId !== NO_SELECTION
          ? { departmentId: Number(departmentId) }
          : {}),
        ...(designationId !== NO_SELECTION
          ? { designationId: Number(designationId) }
          : {}),
        ...(managerId !== NO_SELECTION ? { managerId: Number(managerId) } : {}),
        ...(locationId !== NO_SELECTION
          ? { locationId: Number(locationId) }
          : {}),
        role,
        employmentType,
        employmentStatus: "onboarding",
        joiningDate: new Date(`${joiningDate}T12:00:00`),
      });

      setLastCreated(
        created
          ? {
              id: created.id,
              name: `${created.firstName} ${created.lastName}`.trim(),
            }
          : null,
      );
      toast.success(`${normalizedFirstName} ${normalizedLastName} is in onboarding.`);
      resetForm();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The employee profile could not be created.",
      );
    }
  };

  if (meQuery.isLoading) {
    return <OnboardingSkeleton />;
  }

  if (meQuery.isError || !canProvision) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:p-6 lg:p-8">
        <Card className="border-destructive/30">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <CircleAlert className="size-5" />
              <CardTitle>Onboarding access is unavailable</CardTitle>
            </div>
            <CardDescription>
              Dayflow verifies HR or administrator access before an employee
              profile can be created. Reload the page if your role was changed
              recently.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" render={<Link href="/dashboard" />}>
              Return to dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6 lg:p-8">
      <section className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="outline" className="mb-3 gap-1.5 uppercase tracking-wider">
            <ShieldCheck className="size-3.5" />
            HR workflow
          </Badge>
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <UserPlus className="size-7 text-primary" />
            Start employee onboarding
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Create the employee record first. It stays in onboarding until HR
            completes the employment details and the employee links their
            account using their work email.
          </p>
        </div>
        <Button variant="outline" render={<Link href="/dashboard/people" />}>
          <Users className="size-4" />
          Employee directory
        </Button>
      </section>

      {referenceError ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-950 dark:text-amber-100">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          <p>
            Some organization options could not be loaded. You can still create
            a basic onboarding profile and add the missing assignment later.
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.75fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Profile to provision</CardTitle>
            <CardDescription>
              Required fields create a server-validated employee record with an
              onboarding status. Assignment fields are optional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-7" onSubmit={handleSubmit}>
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <UserPlus className="size-4 text-primary" />
                  Identity
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">First name</Label>
                    <Input
                      id="first-name"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      placeholder="Avery"
                      autoComplete="given-name"
                      disabled={createEmployee.isPending}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Last name</Label>
                    <Input
                      id="last-name"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      placeholder="Morgan"
                      autoComplete="family-name"
                      disabled={createEmployee.isPending}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="work-email">Work email</Label>
                    <Input
                      id="work-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="avery@company.com"
                      autoComplete="email"
                      disabled={createEmployee.isPending}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employee-number">Employee number</Label>
                    <Input
                      id="employee-number"
                      value={employeeNumber}
                      onChange={(event) => setEmployeeNumber(event.target.value)}
                      placeholder="Optional — e.g. DF-1042"
                      disabled={createEmployee.isPending}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone-number">Phone number</Label>
                  <Input
                    id="phone-number"
                    type="tel"
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    placeholder="Optional"
                    autoComplete="tel"
                    disabled={createEmployee.isPending}
                  />
                </div>
              </section>

              <section className="space-y-4 border-t pt-6">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Building2 className="size-4 text-primary" />
                  Organization assignment
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select
                      value={departmentId}
                      onValueChange={(value) => {
                        setDepartmentId(value ?? NO_SELECTION);
                        setDesignationId(NO_SELECTION);
                      }}
                      disabled={departmentsQuery.isLoading || createEmployee.isPending}
                    >
                      <SelectTrigger id="department" className="w-full">
                        <SelectValue placeholder="No department yet" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_SELECTION}>No department yet</SelectItem>
                        {departments.map((department) => (
                          <SelectItem key={department.id} value={String(department.id)}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation</Label>
                    <Select
                      value={designationId}
                      onValueChange={(value) => setDesignationId(value ?? NO_SELECTION)}
                      disabled={designationsQuery.isLoading || createEmployee.isPending}
                    >
                      <SelectTrigger id="designation" className="w-full">
                        <SelectValue placeholder="No designation yet" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_SELECTION}>No designation yet</SelectItem>
                        {availableDesignations.map((designation) => (
                          <SelectItem key={designation.id} value={String(designation.id)}>
                            {designation.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="manager">Reporting manager</Label>
                    <Select
                      value={managerId}
                      onValueChange={(value) => setManagerId(value ?? NO_SELECTION)}
                      disabled={managersQuery.isLoading || createEmployee.isPending}
                    >
                      <SelectTrigger id="manager" className="w-full">
                        <SelectValue placeholder="No manager yet" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_SELECTION}>No manager yet</SelectItem>
                        {managers.map((manager) => (
                          <SelectItem key={manager.id} value={String(manager.id)}>
                            {manager.firstName} {manager.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Work location</Label>
                    <Select
                      value={locationId}
                      onValueChange={(value) => setLocationId(value ?? NO_SELECTION)}
                      disabled={locationsQuery.isLoading || createEmployee.isPending}
                    >
                      <SelectTrigger id="location" className="w-full">
                        <SelectValue placeholder="No location yet" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_SELECTION}>No location yet</SelectItem>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={String(location.id)}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              <section className="space-y-4 border-t pt-6">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <BriefcaseBusiness className="size-4 text-primary" />
                  Employment setup
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Joining date</Label>
                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
                      <Input
                        id="start-date"
                        type="date"
                        className="pl-8"
                        value={joiningDate}
                        onChange={(event) => setJoiningDate(event.target.value)}
                        disabled={createEmployee.isPending}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employment-type">Employment type</Label>
                    <Select
                      value={employmentType}
                      onValueChange={(value) =>
                        setEmploymentType((value ?? "full_time") as EmploymentType)
                      }
                      disabled={createEmployee.isPending}
                    >
                      <SelectTrigger id="employment-type" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EMPLOYMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="access-role">Access role</Label>
                    <Select
                      value={role}
                      onValueChange={(value) =>
                        setRole((value ?? "employee") as ProvisionRole)
                      }
                      disabled={createEmployee.isPending}
                    >
                      <SelectTrigger id="access-role" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">User</SelectItem>
                        {isAdmin ? (
                          <>
                            <SelectItem value="manager">
                              User with manager permissions
                            </SelectItem>
                            <SelectItem value="hr">HR</SelectItem>
                            <SelectItem value="admin">Administrator</SelectItem>
                          </>
                        ) : null}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="flex items-start gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
                  Access roles are checked again by the server. Only an
                  administrator can grant elevated access.
                </p>
              </section>

              <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={createEmployee.isPending}
                >
                  Clear form
                </Button>
                <Button type="submit" disabled={createEmployee.isPending}>
                  {createEmployee.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Creating profile…
                    </>
                  ) : (
                    <>
                      <UserPlus className="size-4" />
                      Create onboarding profile
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <aside className="space-y-6">
          {lastCreated ? (
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardHeader>
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="size-5" />
                  <CardTitle>Profile created</CardTitle>
                </div>
                <CardDescription>
                  {lastCreated.name} is now in the onboarding queue.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant="outline"
                  render={<Link href={`/dashboard/people/${lastCreated.id}`} />}
                >
                  Review employee profile
                  <ArrowRight className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="size-5 text-primary" />
                    Onboarding queue
                  </CardTitle>
                  <CardDescription>
                    Most recently created profiles awaiting completion.
                  </CardDescription>
                </div>
                {!onboardingQuery.isLoading && !onboardingQuery.isError ? (
                  <Badge variant="secondary">{onboardingQuery.data?.total ?? 0}</Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              {onboardingQuery.isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : onboardingQuery.isError ? (
                <p className="text-sm text-muted-foreground">
                  The onboarding queue could not be loaded. Refresh to try again.
                </p>
              ) : onboardingEmployees.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No employee profiles are waiting for onboarding.
                </p>
              ) : (
                <div className="space-y-2">
                  {onboardingEmployees.map((employee) => (
                    <Link
                      key={employee.id}
                      href={`/dashboard/people/${employee.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {employee.firstName} {employee.lastName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {employee.email}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0 capitalize">
                        {statusLabel(employee.employmentStatus)}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-muted/25">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="size-4 text-primary" />
                What happens next
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>1. Review the employee profile and complete their assignments.</p>
              <p>2. Confirm their work email is correct before account setup.</p>
              <p>3. Move the employee to active when onboarding is complete.</p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
