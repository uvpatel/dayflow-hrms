"use client";

import Link from "next/link";
import * as React from "react";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string;
    logo: React.ElementType;
    plan: string;
  }[];
}) {
  const team = teams[0];

  if (!team) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          tooltip="Dayflow dashboard"
          render={<Link href="/dashboard" />}
        >
          <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <team.logo className="size-4" />
          </span>
          <span className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold tracking-tight">{team.name}</span>
            <span className="truncate text-xs text-muted-foreground">{team.plan}</span>
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
