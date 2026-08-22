"use client";

import * as React from "react";
import { NavDocuments } from "@/components/main/nav-documents";
import { NavMain } from "@/components/main/nav-main";
import { NavSecondary } from "@/components/main/nav-secondary";
import { NavUser } from "@/components/main/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutIcon,
  UsersRoundIcon,
  Clock3Icon,
  CalendarDaysIcon,
  WalletCardsIcon,
  BadgeCheckIcon,
  Building2Icon,
  BuildingIcon,
  ShieldCheckIcon,
  MapPinIcon,
  CalendarCheckIcon,
  FileChartColumnIcon,
  Settings2Icon,
  BellIcon,
  ShieldAlertIcon,
  CommandIcon,
} from "lucide-react";
import { useMe } from "@/hooks/use-me";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: meData } = useMe();

  const userObj = {
    name: meData?.user?.name || meData?.employee?.firstName ? `${meData?.employee?.firstName} ${meData?.employee?.lastName || ""}` : "Dayflow User",
    email: meData?.user?.email || "admin@dayflow.dev",
    avatar: "/avatars/avatar.png",
  };

  const navMain = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutIcon />,
    },
    {
      title: "People",
      url: "/dashboard/people",
      icon: <UsersRoundIcon />,
    },
    {
      title: "Attendance",
      url: "/dashboard/attendance",
      icon: <Clock3Icon />,
    },
    {
      title: "Time Off",
      url: "/dashboard/time-off",
      icon: <CalendarDaysIcon />,
    },
    {
      title: "Payroll",
      url: "/dashboard/payroll",
      icon: <WalletCardsIcon />,
    },
    {
      title: "Approvals",
      url: "/dashboard/approvals",
      icon: <BadgeCheckIcon />,
    },
    {
      title: "Organization",
      url: "/dashboard/organization",
      icon: <Building2Icon />,
      items: [
        {
          title: "Overview",
          url: "/dashboard/organization",
          icon: <Building2Icon />,
        },
        {
          title: "Departments",
          url: "/dashboard/organization",
          icon: <BuildingIcon />,
        },
        {
          title: "Designations",
          url: "/dashboard/organization",
          icon: <ShieldCheckIcon />,
        },
        {
          title: "Locations",
          url: "/dashboard/organization",
          icon: <MapPinIcon />,
        },
        {
          title: "Holidays",
          url: "/dashboard/organization",
          icon: <CalendarCheckIcon />,
        },
      ],
    },
  ];

  const quickAccess = [
    {
      name: "Reports & Analytics",
      url: "/dashboard/reports",
      icon: <FileChartColumnIcon />,
    },
    {
      name: "Notifications",
      url: "/dashboard/notifications",
      icon: <BellIcon />,
    },
    {
      name: "Audit Logs",
      url: "/dashboard/audit-logs",
      icon: <ShieldAlertIcon />,
    },
  ];

  const navSecondary = [
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: <Settings2Icon />,
    },
  ];

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              asChild
            >
              <a href="/dashboard" className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                  <CommandIcon className="size-4" />
                </div>
                <span className="text-base font-semibold tracking-tight">Dayflow HR</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavDocuments items={quickAccess} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser username={userObj} />
      </SidebarFooter>
    </Sidebar>
  );
}
