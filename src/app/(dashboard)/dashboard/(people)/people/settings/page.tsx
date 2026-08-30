"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronRight,
  CircleAlert,
  FileBadge2,
  Loader2,
  MapPin,
  Network,
  PencilLine,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/hooks/use-me";
import {
  useDepartments,
  useDesignations,
  useLocations,
  useOrganization,
  useUpdateOrganization,
} from "@/hooks/use-organization";
import {
  hasPermission,
  normalizeAccessRole,
  normalizeRole,
} from "@/lib/permissions";
import type { Organization } from "@/db/schema/organizations";

type ResourceCardProps = {
  title: string;
  description: string;
  count?: number;
  isLoading: boolean;
  isError: boolean;
  icon: LucideIcon;
  href?: string;
  actionLabel?: string;
};

function ResourceCard({
  title,
  description,
  count,
  isLoading,
  isError,
  icon: Icon,
  href,
  actionLabel,
}: ResourceCardProps) {
  return (
    <Card className="flex min-h-48 flex-col">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <span className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="size-4" />
        </span>
      </CardHeader>
      <CardContent className="mt-auto space-y-4">
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : isError ? (
          <p className="text-sm text-muted-foreground">Unavailable</p>
        ) : (
          <p className="text-2xl font-semibold tabular-nums">{count ?? 0}</p>
        )}
        {href && actionLabel ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            render={<Link href={href} />}
          >
            {actionLabel}
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">
            View-only organization context
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function OrganizationEditor({ organization }: { organization: Organization }) {
  const updateOrganization = useUpdateOrganization();
  const [name, setName] = useState(organization.name);
  const [description, setDescription] = useState(organization.description ?? "");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = name.trim();

    if (normalizedName.length < 2) {
      toast.error("Organization name must be at least two characters.");
      return;
    }

    try {
      await updateOrganization.mutateAsync({
        name: normalizedName,
        description: description.trim() || null,
      });
      toast.success("Organization profile saved.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Organization profile could not be saved.",
      );
    }
  };

  return (
    <Card id="organization-profile">
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-primary/10 p-2 text-primary">
            <PencilLine className="size-4" />
          </span>
          <div>
            <CardTitle>Organization profile</CardTitle>
            <CardDescription>
              Changes are saved through the organization API and recorded on
              the current organization only.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="organization-name">Organization name</Label>
            <Input
              id="organization-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={updateOrganization.isPending}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="organization-description">Description</Label>
            <Textarea
              id="organization-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="A short description of the organization"
              disabled={updateOrganization.isPending}
              rows={4}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/45 p-3 text-sm">
            <span className="text-muted-foreground">Primary timezone</span>
            <span className="font-medium">{organization.timezone}</span>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={updateOrganization.isPending}>
              {updateOrganization.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <PencilLine className="size-4" />
                  Save organization profile
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SettingsSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6 lg:p-8">
      <div className="space-y-3 border-b pb-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
      <Skeleton className="h-80 w-full" />
    </div>
  );
}

function roleLabel(role: string) {
  return role === "hr" ? "HR" : `${role[0].toUpperCase()}${role.slice(1)}`;
}

export default function PeopleSettingsPage() {
  const meQuery = useMe();
  const organizationQuery = useOrganization();
  const departmentsQuery = useDepartments();
  const designationsQuery = useDesignations();
  const locationsQuery = useLocations();

  const currentRole = normalizeRole(
    meQuery.data?.employee?.role ?? meQuery.data?.user.role,
  );
  const currentAccessRole =
    meQuery.data?.accessRole ?? normalizeAccessRole(currentRole);
  const isAdmin = currentRole === "admin";
  const canManagePeople = hasPermission(currentRole, "employee:create");
  const canManageStructure =
    hasPermission(currentRole, "department:manage") ||
    hasPermission(currentRole, "designation:manage") ||
    hasPermission(currentRole, "location:manage");
  const isRefreshing =
    organizationQuery.isFetching ||
    departmentsQuery.isFetching ||
    designationsQuery.isFetching ||
    locationsQuery.isFetching;

  const handleRefresh = async () => {
    const results = await Promise.all([
      organizationQuery.refetch(),
      departmentsQuery.refetch(),
      designationsQuery.refetch(),
      locationsQuery.refetch(),
    ]);

    if (results.some((result) => result.isError)) {
      toast.error("Some settings data could not be refreshed.");
      return;
    }

    toast.success("People settings refreshed.");
  };

  if (meQuery.isLoading || organizationQuery.isLoading) {
    return <SettingsSkeleton />;
  }

  if (meQuery.isError) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:p-6 lg:p-8">
        <Card className="border-destructive/30">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <CircleAlert className="size-5" />
              <CardTitle>Settings could not be loaded</CardTitle>
            </div>
            <CardDescription>
              Dayflow could not verify your employee profile. Refresh the page
              or sign in again to continue.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const organization = organizationQuery.data;
  if (organizationQuery.isError || !organization) {
    const errorMessage =
      organizationQuery.error instanceof Error
        ? organizationQuery.error.message
        : "Your employee profile is not currently assigned to an organization.";

    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 md:p-6 lg:p-8">
        <section className="border-b pb-6">
          <Badge variant="outline" className="mb-3 uppercase tracking-wider">
            People settings
          </Badge>
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <Building2 className="size-7 text-primary" />
            Organization context unavailable
          </h1>
        </section>
        <Card className="border-amber-500/30">
          <CardHeader>
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <CircleAlert className="size-5" />
              <CardTitle>Organization assignment needed</CardTitle>
            </div>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" render={<Link href="/dashboard/people/profile" />}>
              <UserRound className="size-4" />
              View my profile
            </Button>
            <Button variant="outline" onClick={() => void handleRefresh()}>
              <RefreshCw className="size-4" />
              Try again
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
            <Network className="size-3.5" />
            People settings
          </Badge>
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <Building2 className="size-7 text-primary" />
            People and organization settings
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Your organization identity, workforce structure, and the actions
            available to your current role.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void handleRefresh()}
          disabled={isRefreshing}
        >
          <RefreshCw className={isRefreshing ? "size-4 animate-spin" : "size-4"} />
          Refresh data
        </Button>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden border-primary/20 bg-linear-to-br from-primary/8 via-background to-background">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <CardDescription>Current organization</CardDescription>
                <CardTitle className="text-2xl">{organization.name}</CardTitle>
                <p className="max-w-xl text-sm text-muted-foreground">
                  {organization.description ||
                    "No organization description has been added yet."}
                </p>
              </div>
              <span className="rounded-xl bg-primary/10 p-3 text-primary">
                <Building2 className="size-6" />
              </span>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-background/70 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Timezone
              </p>
              <p className="mt-1 text-sm font-medium">{organization.timezone}</p>
            </div>
            <div className="rounded-lg border bg-background/70 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Your access
              </p>
              <p className="mt-1 text-sm font-medium">
                {roleLabel(currentAccessRole)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="size-5 text-primary" />
              Your account
            </CardTitle>
            <CardDescription>
              Personal contact details are kept separate from organization
              administration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">
                {meQuery.data?.employee
                  ? `${meQuery.data.employee.firstName} ${meQuery.data.employee.lastName}`
                  : meQuery.data?.user.name}
              </p>
              <p className="text-sm text-muted-foreground">{meQuery.data?.user.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="capitalize">
                {roleLabel(currentAccessRole)}
              </Badge>
              {currentRole === "manager" ? (
                <Badge variant="outline">Manager permissions</Badge>
              ) : null}
              {meQuery.data?.employee?.employmentStatus ? (
                <Badge variant="outline" className="capitalize">
                  {meQuery.data.employee.employmentStatus.replaceAll("_", " ")}
                </Badge>
              ) : null}
            </div>
            <Button
              className="w-full"
              variant="outline"
              render={<Link href="/dashboard/people/profile" />}
            >
              Manage my profile
              <ChevronRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Workforce structure</h2>
          <p className="text-sm text-muted-foreground">
            Live counts from the organization APIs. Management links only appear
            when your role has the corresponding server permission.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <ResourceCard
            title="Departments"
            description="Business units and reporting areas"
            count={departmentsQuery.data?.length}
            isLoading={departmentsQuery.isLoading}
            isError={departmentsQuery.isError}
            icon={Network}
            href={canManageStructure ? "/dashboard/organization?tab=departments" : undefined}
            actionLabel={canManageStructure ? "Manage departments" : undefined}
          />
          <ResourceCard
            title="Designations"
            description="Standard job titles and positions"
            count={designationsQuery.data?.length}
            isLoading={designationsQuery.isLoading}
            isError={designationsQuery.isError}
            icon={FileBadge2}
            href={canManageStructure ? "/dashboard/organization?tab=designations" : undefined}
            actionLabel={canManageStructure ? "Manage designations" : undefined}
          />
          <ResourceCard
            title="Locations"
            description="Office and work location records"
            count={locationsQuery.data?.length}
            isLoading={locationsQuery.isLoading}
            isError={locationsQuery.isError}
            icon={MapPin}
            href={canManageStructure ? "/dashboard/organization?tab=locations" : undefined}
            actionLabel={canManageStructure ? "Manage locations" : undefined}
          />
        </div>
      </section>

      {isAdmin ? (
        <OrganizationEditor
          key={`${organization.id}-${String(organization.updatedAt)}`}
          organization={organization}
        />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="rounded-lg bg-muted p-2 text-muted-foreground">
                <ShieldCheck className="size-4" />
              </span>
              <div>
                <CardTitle>Organization profile is administrator-managed</CardTitle>
                <CardDescription>
                  You can view this information, while organization identity
                  changes require the organization manage permission.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Available next steps</h2>
          <p className="text-sm text-muted-foreground">
            These routes match the access available to your current role.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="flex h-full flex-col gap-4 p-5">
              <UserRound className="size-5 text-primary" />
              <div className="space-y-1">
                <h3 className="font-medium">Personal profile</h3>
                <p className="text-sm text-muted-foreground">
                  Update your own contact number.
                </p>
              </div>
              <Button
                className="mt-auto w-full"
                variant="outline"
                render={<Link href="/dashboard/people/profile" />}
              >
                Open profile
                <ChevronRight className="size-4" />
              </Button>
            </CardContent>
          </Card>

          {canManagePeople ? (
            <Card>
              <CardContent className="flex h-full flex-col gap-4 p-5">
                <Users className="size-5 text-primary" />
                <div className="space-y-1">
                  <h3 className="font-medium">People operations</h3>
                  <p className="text-sm text-muted-foreground">
                    Review the employee directory or begin a new onboarding flow.
                  </p>
                </div>
                <div className="mt-auto flex gap-2">
                  <Button
                    className="flex-1"
                    variant="outline"
                    render={<Link href="/dashboard/people" />}
                  >
                    Directory
                  </Button>
                  <Button
                    className="flex-1"
                    render={<Link href="/dashboard/people/onboarding" />}
                  >
                    Onboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : currentRole === "manager" ? (
            <Card>
              <CardContent className="flex h-full flex-col gap-4 p-5">
                <Users className="size-5 text-primary" />
                <div className="space-y-1">
                  <h3 className="font-medium">My team</h3>
                  <p className="text-sm text-muted-foreground">
                    Review your direct reports and their current status.
                  </p>
                </div>
                <Button
                  className="mt-auto w-full"
                  variant="outline"
                  render={<Link href="/dashboard/my-team" />}
                >
                  Open my team
                  <ChevronRight className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {isAdmin ? (
            <Card>
              <CardContent className="flex h-full flex-col gap-4 p-5">
                <ShieldCheck className="size-5 text-primary" />
                <div className="space-y-1">
                  <h3 className="font-medium">Roles and permissions</h3>
                  <p className="text-sm text-muted-foreground">
                    Review the effective Dayflow role model.
                  </p>
                </div>
                <Button
                  className="mt-auto w-full"
                  variant="outline"
                  render={<Link href="/dashboard/roles" />}
                >
                  Review access
                  <ChevronRight className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>
    </div>
  );
}
