"use client";

import Link from "next/link";
import { ShieldCheck, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/hooks/use-me";
import {
  APP_ACCESS_ROLES,
  ROLE_PERMISSIONS,
  normalizeAccessRole,
  normalizeRole,
  type AccessRole,
  type Permission,
} from "@/lib/permissions";

const ACCESS_ROLE_PERMISSIONS: Record<
  AccessRole,
  readonly Permission[]
> = {
  admin: ROLE_PERMISSIONS.admin,
  hr: ROLE_PERMISSIONS.hr,
  user: ROLE_PERMISSIONS.employee,
};

function roleLabel(role: string) {
  return role === "hr" ? "HR" : `${role[0].toUpperCase()}${role.slice(1)}`;
}

function permissionLabel(permission: string) {
  return permission.replaceAll(":", " · ").replaceAll("_", " ");
}

export default function RolesPage() {
  const meQuery = useMe();
  const currentRole = normalizeRole(
    meQuery.data?.employee?.role ?? meQuery.data?.user.role,
  );
  const currentAccessRole = normalizeAccessRole(currentRole);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6 lg:p-8">
      <section className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="outline" className="mb-3 uppercase tracking-wider">
            Access control
          </Badge>
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <ShieldCheck className="size-7 text-primary" />
            Roles & permissions
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Review the effective Dayflow access model. Permissions are enforced by the server for every API request.
          </p>
        </div>
        <Button render={<Link href="/admin" />}>
          <UsersRound className="size-4" />
          Manage user roles
        </Button>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Your access role</CardTitle>
          <CardDescription>
            This is resolved from your linked employee profile and cannot be
            selected during password or GitHub sign-in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {meQuery.isLoading ? (
            <Skeleton className="h-8 w-36" />
          ) : meQuery.isError ? (
            <p className="text-sm text-destructive">Your role could not be loaded. Refresh the page to try again.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="px-3 py-1 text-sm uppercase">
                {roleLabel(currentAccessRole)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {ROLE_PERMISSIONS[currentRole].length} direct permissions
                {currentRole === "admin" ? " plus full administrative access" : ""}
                {currentRole === "manager"
                  ? " including manager team permissions"
                  : ""}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2">
        {APP_ACCESS_ROLES.map((role) => (
          <Card
            key={role}
            className={role === currentAccessRole ? "border-primary/40" : undefined}
          >
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg">{roleLabel(role)}</CardTitle>
                <CardDescription>
                  {ACCESS_ROLE_PERMISSIONS[role].length} base permissions
                </CardDescription>
              </div>
              {role === currentAccessRole ? (
                <Badge variant="secondary">Current role</Badge>
              ) : null}
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {ACCESS_ROLE_PERMISSIONS[role].map((permission) => (
                  <Badge key={permission} variant="outline" className="font-normal capitalize">
                    {permissionLabel(permission)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
