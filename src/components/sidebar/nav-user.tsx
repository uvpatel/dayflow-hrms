"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  ChevronsUpDownIcon,
  BadgeCheckIcon,
  SettingsIcon,
  LogOutIcon,
  Loader2Icon,
  ShieldIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useMe } from "@/hooks/use-me";

function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.slice(0, 2).toUpperCase();
  }
  return "U";
}

interface UserProp {
  name?: string;
  email?: string;
  avatar?: string;
  role?: string;
}

export function NavUser({
  user: initialUser,
  username,
}: {
  user?: UserProp;
  username?: UserProp;
}) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { data: me } = useMe();

  const fallbackUser = initialUser || username;
  const user = me?.user || fallbackUser;

  const employeeName = me?.employee
    ? `${me.employee.firstName} ${me.employee.lastName}`.trim()
    : undefined;
  const displayName = employeeName || user?.name || user?.email?.split("@")[0] || "User";
  const displayEmail = user?.email || "";
  const displayAvatar =
    (user && "image" in user ? user.image : undefined) || fallbackUser?.avatar || "";
  const displayRole = (
    me?.accessRole ||
    user?.role ||
    fallbackUser?.role ||
    "user"
  ).toUpperCase();
  const initials = getInitials(displayName, displayEmail);

  const handleSignOut = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.replace("/sign-in");
            router.refresh();
          },
        },
      });
    } catch (error) {
      console.error("Sign out error:", error);
      router.replace("/sign-in");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
            }
          >
            <Avatar>
              <AvatarImage src={displayAvatar} alt={displayName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-medium">{displayName}</span>
              </div>
              <span className="truncate text-xs text-muted-foreground">
                {displayEmail}
              </span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-60"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                  <Avatar>
                    <AvatarImage src={displayAvatar} alt={displayName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{displayName}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {displayEmail}
                    </span>
                    <div className="mt-1">
                      <Badge variant="outline" className="text-[10px] uppercase font-semibold py-0 px-1.5 h-4">
                        <ShieldIcon className="mr-1 size-2.5" />
                        {displayRole}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                render={<Link href="/dashboard/profile" />}
                className="flex items-center gap-2 w-full cursor-pointer"
              >
                <BadgeCheckIcon className="size-4" />
                <span>My profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                render={<Link href="/dashboard/settings" />}
                className="flex items-center gap-2 w-full cursor-pointer"
              >
                <SettingsIcon className="size-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              {isLoggingOut ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <LogOutIcon className="size-4" />
              )}
              <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
