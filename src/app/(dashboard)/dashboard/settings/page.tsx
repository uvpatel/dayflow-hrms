"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Building2,
  CalendarClock,
  CalendarDays,
  Clock3,
  DollarSign,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { Organization } from "@/db/schema/organizations";
import { useLeaveTypes } from "@/hooks/use-leave";
import { useMe } from "@/hooks/use-me";
import {
  orgKeys,
  useOrganization,
  useWorkSchedules,
} from "@/hooks/use-organization";
import { useNotifications } from "@/hooks/use-notifications";
import { apiClient, getPaginatedData } from "@/lib/api/client";
import { normalizeRole } from "@/lib/permissions";

type LeavePolicy = {
  id: number;
  name: string;
  description: string | null;
  updatedAt?: string | Date | null;
};

const leavePolicyQueryKey = ["settings", "leave-policies"] as const;

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function formatMinutes(minutes: number) {
  const value = Number(minutes);
  if (!Number.isFinite(value)) return "Not configured";

  return (
    String(Math.floor(value / 60)).padStart(2, "0") +
    ":" +
    String(value % 60).padStart(2, "0")
  );
}

function formatWeekdays(weekdays: string) {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const values = weekdays
    .split(",")
    .map((day) => Number(day.trim()))
    .filter((day) => Number.isInteger(day) && day >= 1 && day <= 7);

  if (values.length === 0) return "Not configured";
  if (values.join(",") === "1,2,3,4,5") return "Mon–Fri";

  return values.map((day) => labels[day - 1]).join(", ");
}

function formatDate(value?: string | Date | null) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function roleLabel(role: string) {
  if (role === "admin") return "Administrator";
  if (role === "hr") return "HR operations";
  if (role === "manager") return "Manager";
  return "Employee";
}

function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-destructive/30 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3 text-sm">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
        <p className="text-destructive">{message}</p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

export default function SettingsPage() {
  const [policyName, setPolicyName] = useState("");
  const [policyDescription, setPolicyDescription] = useState("");
  const queryClient = useQueryClient();

  const meQuery = useMe();
  const organizationQuery = useOrganization();
  const role = normalizeRole(
    meQuery.data?.employee?.role ?? meQuery.data?.user.role,
  );
  const canManageOrganization = role === "admin";
  const canManageLeave = role === "admin" || role === "hr";
  const canManageSchedules = role === "admin" || role === "hr";
  const canViewTeam = role === "manager" || canManageSchedules;
  const employeeId = meQuery.data?.employee?.id;

  const schedulesQuery = useWorkSchedules(employeeId, {
    enabled: Boolean(employeeId),
  });
  const leaveTypesQuery = useLeaveTypes();
  const notificationsQuery = useNotifications();
  const policiesQuery = useQuery({
    queryKey: leavePolicyQueryKey,
    queryFn: async () => {
      const response = await apiClient<
        LeavePolicy[] | { items: LeavePolicy[]; total: number }
      >("/api/v1/leave-policies");
      return getPaginatedData(response).items;
    },
  });

  const updateOrganizationMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      description: string | null;
    }) => {
      const response = await apiClient<Organization>("/api/v1/organizations", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (!response.data) {
        throw new Error("The organization update returned no data");
      }

      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: orgKeys.info() });
    },
  });

  const createLeavePolicyMutation = useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      const response = await apiClient<LeavePolicy>("/api/v1/leave-policies", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!response.data) {
        throw new Error("The leave policy creation returned no data");
      }

      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: leavePolicyQueryKey });
    },
  });

  const organization = organizationQuery.data;
  const schedules = schedulesQuery.data ?? [];
  const leaveTypes = (leaveTypesQuery.data ?? []).filter(
    (leaveType) => leaveType.active,
  );
  const policies = policiesQuery.data ?? [];
  const notifications = notificationsQuery.data ?? [];
  const unreadNotifications = notifications.filter(
    (notification) => notification.read === 0,
  );
  const isRefreshing =
    organizationQuery.isFetching ||
    schedulesQuery.isFetching ||
    leaveTypesQuery.isFetching ||
    policiesQuery.isFetching ||
    notificationsQuery.isFetching;

  const handleRefresh = async () => {
    const results = await Promise.all([
      organizationQuery.refetch(),
      leaveTypesQuery.refetch(),
      policiesQuery.refetch(),
      notificationsQuery.refetch(),
    ]);
    const scheduleResult = employeeId
      ? await schedulesQuery.refetch()
      : undefined;
    const hasError =
      results.some((result) => result.isError) ||
      scheduleResult?.isError === true;

    if (hasError) {
      toast.error("Some settings could not be refreshed. Please try again.");
      return;
    }

    toast.success("Settings synchronized");
  };

  const handleOrganizationSave = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!canManageOrganization) {
      toast.error("Only workspace administrators can update the organization profile.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (name.length < 2) {
      toast.error("Organization name must be at least 2 characters.");
      return;
    }

    try {
      await updateOrganizationMutation.mutateAsync({
        name,
        description: description || null,
      });
      toast.success("Organization profile updated");
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to update organization profile"));
    }
  };

  const handleCreateLeavePolicy = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!canManageLeave) {
      toast.error("Only HR and administrators can create leave policies.");
      return;
    }

    const name = policyName.trim();
    if (name.length < 2) {
      toast.error("Policy name must be at least 2 characters.");
      return;
    }

    try {
      await createLeavePolicyMutation.mutateAsync({
        name,
        description: policyDescription.trim() || undefined,
      });
      setPolicyName("");
      setPolicyDescription("");
      toast.success("Leave policy " + name + " created");
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to create leave policy"));
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Link
              href="/dashboard"
              className="transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
            <span>/</span>
            <span className="font-medium text-foreground">Settings</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight md:text-3xl">
              <Settings2 className="size-7 text-primary" />
              Organization settings
            </h1>
            {!meQuery.isLoading && (
              <Badge variant="outline">{roleLabel(role)}</Badge>
            )}
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Live organization profile, assigned schedules, leave configuration,
            and your notification inbox.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManageOrganization ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              render={<Link href="/dashboard/people/settings/billing" />}
            >
              <DollarSign className="size-4" />
              Billing &amp; plans
            </Button>
          ) : null}
          {canViewTeam ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              render={<Link href="/dashboard/people/settings/team" />}
            >
              <Users className="size-4" />
              Team workspace
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={
                isRefreshing ? "size-4 animate-spin" : "size-4"
              }
            />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="organization" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="organization" className="gap-2">
            <Building2 className="size-4 text-primary" />
            <span className="hidden sm:inline">Organization</span>
            <span className="sm:hidden">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-2">
            <Clock3 className="size-4 text-emerald-600" />
            <span className="hidden sm:inline">Attendance</span>
            <span className="sm:hidden">Schedule</span>
          </TabsTrigger>
          <TabsTrigger value="leave" className="gap-2">
            <CalendarDays className="size-4 text-amber-500" />
            <span className="hidden sm:inline">Leave</span>
            <span className="sm:hidden">Time off</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="size-4 text-indigo-500" />
            <span className="hidden sm:inline">Notifications</span>
            <span className="sm:hidden">Inbox</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organization">
          {organizationQuery.isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-4 w-80" />
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-28 sm:col-span-2" />
              </CardContent>
            </Card>
          ) : organizationQuery.isError ? (
            <Card>
              <CardContent className="p-6">
                <ErrorPanel
                  message={getErrorMessage(
                    organizationQuery.error,
                    "Organization profile could not load.",
                  )}
                  onRetry={() => void organizationQuery.refetch()}
                />
              </CardContent>
            </Card>
          ) : !organization ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                No organization is linked to this account yet.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="size-5 text-primary" />
                  Organization profile
                </CardTitle>
                <CardDescription>
                  This profile is loaded from the active workspace. Only
                  administrators can update the writable fields.
                </CardDescription>
              </CardHeader>
              <form key={organization.id} onSubmit={handleOrganizationSave}>
                <CardContent className="space-y-5">
                  {!canManageOrganization && !meQuery.isLoading && (
                    <div className="flex gap-3 rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 text-sm">
                      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-amber-600" />
                      <p>
                        You have read-only access to organization settings.
                        Profile changes are limited to workspace administrators.
                      </p>
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="organization-name">Organization name</Label>
                      <Input
                        id="organization-name"
                        name="name"
                        defaultValue={organization.name}
                        disabled={
                          !canManageOrganization ||
                          updateOrganizationMutation.isPending
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="organization-timezone">Workspace timezone</Label>
                      <Input
                        id="organization-timezone"
                        value={organization.timezone}
                        readOnly
                        aria-readonly="true"
                      />
                      <p className="text-xs text-muted-foreground">
                        The current API exposes this setting as read-only.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="organization-description">Description</Label>
                    <Textarea
                      id="organization-description"
                      name="description"
                      defaultValue={organization.description ?? ""}
                      disabled={
                        !canManageOrganization ||
                        updateOrganizationMutation.isPending
                      }
                      placeholder="Describe this organization"
                      rows={4}
                    />
                  </div>
                  <div className="grid gap-3 rounded-lg bg-muted/45 p-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Workspace ID</p>
                      <p className="mt-1 font-medium">#{organization.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Last updated</p>
                      <p className="mt-1 font-medium">
                        {formatDate(organization.updatedAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 border-t sm:flex-row sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Contact, payroll, and address fields are not stored by the
                    organization API, so they are not shown as fake saveable
                    settings.
                  </p>
                  {canManageOrganization && (
                    <Button
                      type="submit"
                      className="w-full shrink-0 gap-1.5 sm:w-auto"
                      disabled={updateOrganizationMutation.isPending}
                    >
                      <Save className="size-4" />
                      {updateOrganizationMutation.isPending
                        ? "Saving..."
                        : "Save profile"}
                    </Button>
                  )}
                </CardFooter>
              </form>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarClock className="size-5 text-emerald-600" />
                  Assigned work schedules
                </CardTitle>
                <CardDescription className="mt-1">
                  Attendance thresholds are set on individual schedule
                  assignments, not a simulated global switch.
                </CardDescription>
              </div>
              {canManageSchedules ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  render={<Link href="/dashboard/work-schedules" />}
                >
                  Manage schedules
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  render={<Link href="/dashboard/attendance" />}
                >
                  View attendance
                  <ArrowRight className="size-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {meQuery.isLoading || schedulesQuery.isLoading ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Skeleton className="h-44" />
                  <Skeleton className="h-44" />
                </div>
              ) : !employeeId ? (
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                  An employee profile is required before a schedule can be
                  shown for this account.
                </div>
              ) : schedulesQuery.isError ? (
                <ErrorPanel
                  message={getErrorMessage(
                    schedulesQuery.error,
                    "Work schedules could not load.",
                  )}
                  onRetry={() => void schedulesQuery.refetch()}
                />
              ) : schedules.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No work schedule is assigned yet.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {schedules.map((schedule) => (
                    <div key={schedule.id} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{schedule.scheduleName}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Starts {formatDate(schedule.startDate)}
                          </p>
                        </div>
                        <Badge variant="outline">{schedule.timezone}</Badge>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Shift</p>
                          <p className="mt-1 font-medium tabular-nums">
                            {formatMinutes(schedule.shiftStartMinutes)}–
                            {formatMinutes(schedule.shiftEndMinutes)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Work days</p>
                          <p className="mt-1 font-medium">
                            {formatWeekdays(schedule.weekdays)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Grace period</p>
                          <p className="mt-1 font-medium">
                            {schedule.graceMinutes} minutes
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Full day</p>
                          <p className="mt-1 font-medium">
                            {Math.round((schedule.fullDayMinutes / 60) * 10) / 10}
                            {" hours"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarDays className="size-5 text-amber-500" />
                  Available leave types
                </CardTitle>
                <CardDescription>
                  Active leave types configured for your organization.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {leaveTypesQuery.isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-14" />
                    <Skeleton className="h-14" />
                  </div>
                ) : leaveTypesQuery.isError ? (
                  <ErrorPanel
                    message={getErrorMessage(
                      leaveTypesQuery.error,
                      "Leave types could not load.",
                    )}
                    onRetry={() => void leaveTypesQuery.refetch()}
                  />
                ) : leaveTypes.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No active leave types are configured.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {leaveTypes.map((leaveType) => (
                      <div
                        key={leaveType.id}
                        className="flex items-start justify-between gap-3 rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium">{leaveType.name}</p>
                          {leaveType.description && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {leaveType.description}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline">
                          {leaveType.requiresBalance
                            ? "Balance tracked"
                            : "No balance"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  render={<Link href="/dashboard/time-off/balance" />}
                >
                  View my leave balance
                  <ArrowRight className="size-4" />
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="size-5 text-amber-500" />
                  Leave policies
                </CardTitle>
                <CardDescription>
                  Policy records shared across this organization.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {policiesQuery.isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-14" />
                    <Skeleton className="h-14" />
                  </div>
                ) : policiesQuery.isError ? (
                  <ErrorPanel
                    message={getErrorMessage(
                      policiesQuery.error,
                      "Leave policies could not load.",
                    )}
                    onRetry={() => void policiesQuery.refetch()}
                  />
                ) : policies.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No leave policies have been created yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {policies.map((policy) => (
                      <div key={policy.id} className="rounded-lg border p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{policy.name}</p>
                            {policy.description && (
                              <p className="mt-1 text-sm text-muted-foreground">
                                {policy.description}
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            Updated {formatDate(policy.updatedAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {canManageLeave && (
                  <form
                    onSubmit={handleCreateLeavePolicy}
                    className="space-y-3 rounded-lg border bg-muted/30 p-4"
                  >
                    <div>
                      <p className="font-medium">Create a leave policy</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        HR and administrators can add policy records with the
                        live leave-policy API.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="policy-name">Policy name</Label>
                        <Input
                          id="policy-name"
                          value={policyName}
                          onChange={(event) => setPolicyName(event.target.value)}
                          placeholder="e.g. Annual leave policy"
                          disabled={createLeavePolicyMutation.isPending}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="policy-description">Description</Label>
                        <Input
                          id="policy-description"
                          value={policyDescription}
                          onChange={(event) =>
                            setPolicyDescription(event.target.value)
                          }
                          placeholder="Optional details"
                          disabled={createLeavePolicyMutation.isPending}
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={createLeavePolicyMutation.isPending}
                    >
                      {createLeavePolicyMutation.isPending
                        ? "Creating..."
                        : "Create policy"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bell className="size-5 text-indigo-500" />
                  Your notification inbox
                </CardTitle>
                <CardDescription className="mt-1">
                  Live notifications for the signed-in employee account.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                render={<Link href="/dashboard/notifications" />}
              >
                Open inbox
                <ArrowRight className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border bg-primary/5 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Unread
                  </p>
                  <p className="mt-2 text-3xl font-semibold">
                    {notificationsQuery.isLoading ? "—" : unreadNotifications.length}
                  </p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Total received
                  </p>
                  <p className="mt-2 text-3xl font-semibold">
                    {notificationsQuery.isLoading ? "—" : notifications.length}
                  </p>
                </div>
              </div>

              {notificationsQuery.isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : notificationsQuery.isError ? (
                <ErrorPanel
                  message={getErrorMessage(
                    notificationsQuery.error,
                    "Notifications could not load.",
                  )}
                  onRetry={() => void notificationsQuery.refetch()}
                />
              ) : notifications.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  You are all caught up. New workflow updates will appear here.
                </div>
              ) : (
                <div className="divide-y rounded-lg border">
                  {notifications.slice(0, 3).map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-start gap-3 p-4"
                    >
                      <div
                        className={
                          notification.read === 0
                            ? "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
                            : "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                        }
                      >
                        <Bell className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p
                          className={
                            notification.read === 0
                              ? "text-sm font-medium"
                              : "text-sm text-muted-foreground"
                          }
                        >
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
