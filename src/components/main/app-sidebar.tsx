"use client"

import * as React from "react"

import { NavDocuments } from "@/components/main/nav-documents"
import { NavMain } from "@/components/main/nav-main"
import { NavSecondary } from "@/components/main/nav-secondary"
import { NavUser } from "@/components/main/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LayoutDashboard, ListIcon, ChartBarIcon, FolderIcon, UsersIcon, CameraIcon, FileTextIcon, Settings2Icon, CircleHelpIcon, SearchIcon, DatabaseIcon, FileChartColumnIcon, FileIcon, CommandIcon } from "lucide-react"

import {
  BadgeCheckIcon,
  Building2Icon,
  BuildingIcon,
  CalendarCheckIcon,
  CalendarDaysIcon,
  ChartNoAxesCombinedIcon,
  
  Clock3Icon,
  
  FolderKanbanIcon,
  LayoutDashboardIcon,
  MapPinIcon,
  

  ShieldCheckIcon,
  UsersRoundIcon,
  WalletCardsIcon,
} from "lucide-react";

export const data = {
  user: {
    name: "Urvil Patel",
    email: "urvil@dayflow.com",
    avatar: "/avatars/urvil.jpg",
  },

  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
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
          icon: <ChartNoAxesCombinedIcon />,
        },
        {
          title: "Departments",
          url: "/dashboard/departments",
          icon: <BuildingIcon />,
        },
        {
          title: "Designations",
          url: "/dashboard/designations",
          icon: <ShieldCheckIcon />,
        },
        {
          title: "Office Locations",
          url: "/dashboard/office-locations",
          icon: <MapPinIcon />,
        },
        {
          title: "Holidays",
          url: "/dashboard/holidays",
          icon: <CalendarCheckIcon />,
        },
      ],
    },
  ],

  navWorkspace: [
    {
      title: "Documents",
      url: "/dashboard/documents",
      icon: <FileTextIcon />,
      items: [
        {
          title: "Company Policies",
          url: "/dashboard/documents/policies",
        },
        {
          title: "Employee Documents",
          url: "/dashboard/documents/employees",
        },
        {
          title: "Templates",
          url: "/dashboard/documents/templates",
        },
      ],
    },
    {
      title: "Reports",
      url: "/dashboard/reports",
      icon: <FileChartColumnIcon />,
      items: [
        {
          title: "Attendance Reports",
          url: "/dashboard/reports/attendance",
        },
        {
          title: "Payroll Reports",
          url: "/dashboard/reports/payroll",
        },
        {
          title: "Employee Reports",
          url: "/dashboard/reports/employees",
        },
      ],
    },
  ],

  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: <Settings2Icon />,
    },
    {
      title: "Help & Support",
      url: "/dashboard/help",
      icon: <CircleHelpIcon />,
    },
    {
      title: "Search",
      url: "/dashboard/search",
      icon: <SearchIcon />,
    },
  ],

  quickAccess: [
    {
      name: "Employee Directory",
      url: "/dashboard/people",
      icon: <UsersRoundIcon />,
    },
    {
      name: "Leave Calendar",
      url: "/dashboard/time-off/calendar",
      icon: <CalendarDaysIcon />,
    },
    {
      name: "HR Documents",
      url: "/dashboard/documents",
      icon: <FolderKanbanIcon />,
    },
    {
      name: "Reports",
      url: "/dashboard/reports",
      icon: <FileChartColumnIcon />,
    },
  ],
};


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="#" />}
            >
              <CommandIcon className="size-5!" />
              <span className="text-base font-semibold">Dayflow Inc.</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.quickAccess} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser username={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
