"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  Building2,
  Users,
  Shield,
  UserRound,
  LayoutDashboard,
  Bell,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/toggler";
import { useMe } from "@/hooks/use-me";
import { useNotifications } from "@/hooks/use-notifications";
import { authClient } from "@/lib/auth-client";

type PortalRole = "admin" | "hr" | "manager" | "employee";

interface PortalHeaderProps {
  portalTitle: string;
  portalRole: PortalRole;
  description?: string;
  badgeLabel?: string;
  children?: React.ReactNode;
}

export function PortalHeader({
  portalTitle,
  portalRole,
  description,
  badgeLabel,
  children,
}: PortalHeaderProps) {
  const router = useRouter();
  const { data: me } = useMe();
  const { data: notifications = [] } = useNotifications();

  const userRole = (
    me?.employee?.role ??
    me?.user.role ??
    "employee"
  ).toLowerCase() as PortalRole;

  const canAccessHR = userRole === "hr" || userRole === "admin";
  const canAccessManager =
    userRole === "manager" || userRole === "hr" || userRole === "admin";
  const canAccessAdmin = userRole === "admin";

  const unreadCount = notifications.filter((n) => n.read === 0).length;

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      toast.success("Signed out successfully");
      router.push("/sign-in");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  const userInitials = me?.employee
    ? `${me.employee.firstName[0] || ""}${me.employee.lastName[0] || ""}`.toUpperCase()
    : (me?.user.name?.slice(0, 2) || "U").toUpperCase();

  const roleBadgeStyles: Record<PortalRole, string> = {
    admin: "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400",
    hr: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
    manager: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
    employee: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  };

  const roleIcon: Record<PortalRole, React.ReactNode> = {
    admin: <Shield className="size-4 text-red-600 dark:text-red-400" />,
    hr: <Building2 className="size-4 text-amber-600 dark:text-amber-400" />,
    manager: <Users className="size-4 text-blue-600 dark:text-blue-400" />,
    employee: <UserRound className="size-4 text-emerald-600 dark:text-emerald-400" />,
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: Brand & Portal Badge */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold tracking-tight transition-opacity hover:opacity-80"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <BriefcaseBusiness className="size-5" />
            </div>
            <div className="hidden flex-col sm:flex">
              <span className="text-base font-bold leading-none">Dayflow</span>
              <span className="text-[10px] text-muted-foreground">HRMS Portal</span>
            </div>
          </Link>

          <ChevronRight className="hidden size-4 text-muted-foreground md:block" />

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`flex items-center gap-1.5 py-0.5 text-xs font-semibold capitalize ${roleBadgeStyles[portalRole]}`}
            >
              {roleIcon[portalRole]}
              <span>{badgeLabel || `${portalRole} Portal`}</span>
            </Badge>
          </div>
        </div>

        {/* Center / Navigation Shortcuts */}
        <nav className="hidden items-center gap-1 md:flex">
          <Button
            render={<Link href="/dashboard" />}
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <LayoutDashboard className="size-3.5" />
            Full Dashboard
          </Button>

          <Button
            render={<Link href="/employee" />}
            variant={portalRole === "employee" ? "secondary" : "ghost"}
            size="sm"
            className="text-xs font-medium"
          >
            <UserRound className="size-3.5" />
            User
          </Button>

          {canAccessManager && (
            <Button
              render={<Link href="/manager" />}
              variant={portalRole === "manager" ? "secondary" : "ghost"}
              size="sm"
              className="text-xs font-medium"
            >
              <Users className="size-3.5" />
              Manager
            </Button>
          )}

          {canAccessHR && (
            <Button
              render={<Link href="/hr" />}
              variant={portalRole === "hr" ? "secondary" : "ghost"}
              size="sm"
              className="text-xs font-medium"
            >
              <Building2 className="size-3.5" />
              HR Hub
            </Button>
          )}

          {canAccessAdmin && (
            <Button
              render={<Link href="/admin" />}
              variant={portalRole === "admin" ? "secondary" : "ghost"}
              size="sm"
              className="text-xs font-medium"
            >
              <Shield className="size-3.5" />
              Admin
            </Button>
          )}
        </nav>

        {/* Right: Notifications, Theme, User Avatar */}
        <div className="flex items-center gap-2">
          {children}

          <Button
            render={<Link href="/dashboard/notifications" />}
            variant="ghost"
            size="icon"
            className="relative size-8 text-muted-foreground hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>

          <ModeToggle />

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 p-1 focus-visible:ring-2"
                />
              }
            >
              <Avatar size="sm" className="size-8 cursor-pointer ring-1 ring-border">
                {me?.user.image ? (
                  <AvatarImage src={me.user.image} alt={me.user.name || "User"} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none">
                    {me?.employee
                      ? `${me.employee.firstName} ${me.employee.lastName}`
                      : me?.user.name || "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {me?.user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
                <UserRound className="mr-2 size-4" />
                <span>My Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                <LayoutDashboard className="mr-2 size-4" />
                <span>Full HRMS Dashboard</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut className="mr-2 size-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {description ? (
        <div className="border-t bg-muted/20 px-4 py-2 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <span className="font-medium text-foreground">{portalTitle}</span>
            <span>{description}</span>
          </div>
        </div>
      ) : null}
    </header>
  );
}
