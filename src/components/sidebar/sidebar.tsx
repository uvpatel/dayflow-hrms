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
      name: "Dayflow",
      logo: Building2,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: Building2,
      plan: "Startup",
    },
  ],
  navMain: [
    {
      title: "People",
      url: "/platform/people",
      icon: Users,
      isActive: true,
      items: [
        { title: "Directory", url: "/platform/people" },
        { title: "Onboarding", url: "/platform/people/onboarding" },
        { title: "Profile", url: "/platform/people/profile" },
      ],
    },
    {
      title: "Attendance",
      url: "/platform/attendance",
      icon: CalendarCheck,
      items: [
        { title: "Daily View", url: "/platform/attendance/daily" },
        { title: "Weekly View", url: "/platform/attendance/weekly" },
        { title: "Regularization", url: "/platform/attendance/regularize" },
      ],
    },
    {
      title: "Time Off",
      url: "/platform/time-off",
      icon: CalendarClock,
      items: [
        { title: "My Requests", url: "/platform/time-off" },
        { title: "Apply", url: "/platform/time-off/apply" },
        { title: "Leave Balance", url: "/platform/time-off/balance" },
      ],
    },
    {
      title: "Approvals",
      url: "/platform/approvals",
      icon: CheckCircle2,
      items: [
        { title: "Leave Requests", url: "/platform/approvals/leave" },
        { title: "Attendance Corrections", url: "/platform/approvals/attendance" },
      ],
    },
    {
      title: "Payroll",
      url: "/platform/payroll",
      icon: Wallet,
      items: [
        { title: "My Payslips", url: "/platform/payroll" },
        { title: "Salary Structure", url: "/platform/payroll/structure" },
      ],
    },
    {
      title: "Organization",
      url: "/platform/organization",
      icon: Building2,
      items: [
        { title: "Departments", url: "/platform/organization/departments" },
        { title: "Roles", url: "/platform/organization/roles" },
        { title: "Holidays", url: "/platform/organization/holidays" },
      ],
    },
    {
      title: "Settings",
      url: "/platform/settings",
      icon: Settings2,
      items: [
        { title: "General", url: "/platform/settings" },
        { title: "Team", url: "/platform/settings/team" },
        { title: "Billing", url: "/platform/settings/billing" },
      ],
    },
  ],
  projects: [
    {
      name: "Quick Attendance",
      url: "/platform/attendance/daily",
      icon: LayoutDashboard,
    },
    {
      name: "Apply Leave",
      url: "/platform/time-off/apply",
      icon: UserPlus,
    },
    {
      name: "My Payslip",
      url: "/platform/payroll",
      icon: FileText,
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
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
