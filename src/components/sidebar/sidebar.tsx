"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/sidebar/navmain"
import { NavProjects } from "@/components/sidebar/nav-project"
import { NavUser } from "@/components/sidebar/nav-user"
import { TeamSwitcher } from "@/components/sidebar/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

import {
  Users,
  CalendarCheck,
  CalendarClock,
  Wallet,
  CheckCircle2,
  Building2,

  LayoutDashboard,
  UserPlus,
  FileText,
} from "lucide-react"

const data = {
  user: {
    name: "Urvil Patel",
    email: "urvil@dayflow.app",
    avatar: "/avatars/urvil.jpg",
  },
  teams: [
    {
      name: "Dayflow Employee",
      logo: Building2,
      plan: "Enterprise",
    },
    {
      name: "Dayflow Admin",
      logo: Building2,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "People",
      url: "/dashboard/people",
      icon: Users,
      isActive: true,
      items: [
        { title: "Directory", url: "/dashboard/people" },
        { title: "Onboarding", url: "/dashboard/people/onboarding" },
        { title: "Profile", url: "/dashboard/people/profile" },
      ],
    },
    {
      title: "Attendance",
      url: "/dashboard/attendance",
      icon: CalendarCheck,
      items: [
        { title: "Daily View", url: "/dashboard/attendance/daily" },
        { title: "Weekly View", url: "/dashboard/attendance/weekly" },
        { title: "Regularization", url: "/dashboard/attendance/regularize" },
      ],
    },
    {
      title: "Time Off",
      url: "/dashboard/time-off",
      icon: CalendarClock,
      items: [
        { title: "My Requests", url: "/dashboard/time-off" },
        { title: "Apply", url: "/dashboard/time-off/apply" },
        { title: "Leave Balance", url: "/dashboard/time-off/balance" },
      ],
    },
    {
      title: "Approvals",
      url: "/dashboard/approvals",
      icon: CheckCircle2,
      items: [
        { title: "Leave Requests", url: "/dashboard/approvals/leave" },
        { title: "Attendance Corrections", url: "/dashboard/approvals/attendance" },
      ],
    },
    {
      title: "Payroll",
      url: "/dashboard/payroll",
      icon: Wallet,
      items: [
        { title: "My Payslips", url: "/dashboard/payroll" },
        { title: "Salary Structure", url: "/dashboard/payroll/structure" },
      ],
    },
    {
      title: "Organization",
      url: "/dashboard/organization",
      icon: Building2,
      items: [
        { title: "Departments", url: "/dashboard/organization/departments" },
        { title: "Roles", url: "/dashboard/organization/roles" },
        { title: "Holidays", url: "/dashboard/organization/holidays" },
      ],
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings2,
      items: [
        { title: "General", url: "/dashboard/settings" },
        { title: "Team", url: "/dashboard/settings/team" },
        { title: "Billing", url: "/dashboard/settings/billing" },
      ],
    },
  ],
 
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
       
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
