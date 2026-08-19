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
import { Layout, ListIcon, ChartBarIcon, FolderIcon, UsersIcon, CameraIcon, FileTextIcon, Settings2Icon, CircleHelpIcon, SearchIcon, DatabaseIcon, FileChartColumnIcon, FileIcon, CommandIcon } from "lucide-react"

import {
  BadgeCheckIcon,
  Building2Icon,
  BuildingIcon,
  CalendarCheckIcon,
  CalendarDaysIcon,
  ChartNoAxesCombinedIcon,
  
  Clock3Icon,
  
  FolderKanbanIcon,
  LayoutIcon,
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
      title: "",
      url: "/",
      icon: <LayoutIcon />,
    },
    {
      title: "People",
      url: "//people",
      icon: <UsersRoundIcon />,
    },
    {
      title: "Attendance",
      url: "//attendance",
      icon: <Clock3Icon />,
    },
    {
      title: "Time Off",
      url: "//time-off",
      icon: <CalendarDaysIcon />,
    },
    {
      title: "Payroll",
      url: "//payroll",
      icon: <WalletCardsIcon />,
    },
    {
      title: "Approvals",
      url: "//approvals",
      icon: <BadgeCheckIcon />,
    },
    {
      title: "Organization",
      url: "//organization",
      icon: <Building2Icon />,
      items: [
        {
          title: "Overview",
          url: "//organization",
          icon: <ChartNoAxesCombinedIcon />,
        },
        {
          title: "Departments",
          url: "//departments",
          icon: <BuildingIcon />,
        },
        {
          title: "Designations",
          url: "//designations",
          icon: <ShieldCheckIcon />,
        },
        {
          title: "Office Locations",
          url: "//office-locations",
          icon: <MapPinIcon />,
        },
        {
          title: "Holidays",
          url: "//holidays",
          icon: <CalendarCheckIcon />,
        },
      ],
    },
  ],

  navWorkspace: [
    {
      title: "Documents",
      url: "//documents",
      icon: <FileTextIcon />,
      items: [
        {
          title: "Company Policies",
          url: "//documents/policies",
        },
        {
          title: "Employee Documents",
          url: "//documents/employees",
        },
        {
          title: "Templates",
          url: "//documents/templates",
        },
      ],
    },
    {
      title: "Reports",
      url: "//reports",
      icon: <FileChartColumnIcon />,
      items: [
        {
          title: "Attendance Reports",
          url: "//reports/attendance",
        },
        {
          title: "Payroll Reports",
          url: "//reports/payroll",
        },
        {
          title: "Employee Reports",
          url: "//reports/employees",
        },
      ],
    },
  ],

  navSecondary: [
    {
      title: "Settings",
      url: "//settings",
      icon: <Settings2Icon />,
    },
    {
      title: "Help & Support",
      url: "//help",
      icon: <CircleHelpIcon />,
    },
    {
      title: "Search",
      url: "//search",
      icon: <SearchIcon />,
    },
  ],

  quickAccess: [
    {
      name: "Employee Directory",
      url: "//people",
      icon: <UsersRoundIcon />,
    },
    {
      name: "Leave Calendar",
      url: "//time-off/calendar",
      icon: <CalendarDaysIcon />,
    },
    {
      name: "HR Documents",
      url: "//documents",
      icon: <FolderKanbanIcon />,
    },
    {
      name: "Reports",
      url: "//reports",
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
