"use client";

import * as React from "react";
import {
  Users,
  CalendarCheck,
  CalendarClock,
  Wallet,
  CheckCircle2,
  Building2,
  Settings2,
  LayoutDashboard,
  BarChart3,
} from "lucide-react";

import { NavMain, type NavMainItem } from "@/components/sidebar/navmain";
import { NavUser } from "@/components/sidebar/nav-user";
import { TeamSwitcher } from "@/components/sidebar/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession();
  const userRole = ((session?.user as { role?: string })?.role || "employee").toLowerCase();

  const isAdmin = userRole === "admin";
  const isHR = userRole === "hr" || isAdmin;
  const isManager = userRole === "manager" || isHR;

  const teams = [
    {
      name: isAdmin ? "Dayflow Enterprise" : isHR ? "Dayflow HR" : isManager ? "Dayflow Team" : "Dayflow HRMS",
      logo: Building2,
      plan: isAdmin ? "Administrator" : isHR ? "HR Operations" : isManager ? "Manager" : "Employee Portal",
    },
  ];

  // Dynamic role-aware canonical navigation
  const navMain: NavMainItem[] = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
      items: [
        { title: "Overview", url: "/dashboard" },
      ],
    },
    ...(isHR
      ? [
          {
            title: "People",
            url: "/dashboard/people",
            icon: Users,
            items: [
              { title: "Directory", url: "/dashboard/people" },
              { title: "Onboarding", url: "/dashboard/people/onboarding" },
              { title: "My Profile", url: "/dashboard/people/profile" },
            ],
          },
        ]
      : [
          {
            title: "People",
            url: "/dashboard/people/profile",
            icon: Users,
            items: [
              { title: "My Profile", url: "/dashboard/people/profile" },
            ],
          },
        ]),
    {
      title: "Attendance",
      url: "/dashboard/attendance",
      icon: CalendarCheck,
      items: [
        { title: "Overview", url: "/dashboard/attendance" },
        { title: "Daily View", url: "/dashboard/attendance/daily" },
        { title: "Weekly View", url: "/dashboard/attendance/weekly" },
        { title: "Corrections", url: "/dashboard/attendance/corrections" },
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
    ...(isManager
      ? [
          {
            title: "Approvals",
            url: "/dashboard/approvals",
            icon: CheckCircle2,
            items: [
              { title: "All Approvals", url: "/dashboard/approvals" },
              { title: "Leave Requests", url: "/dashboard/approvals/leave" },
              { title: "Attendance", url: "/dashboard/approvals/attendance" },
            ],
          },
        ]
      : []),
    {
      title: "Payroll",
      url: "/dashboard/payroll",
      icon: Wallet,
      items: [
        { title: "My Payslips", url: "/dashboard/payroll" },
        ...(isHR
          ? [
              { title: "Pay Periods", url: "/dashboard/payroll/periods" },
              { title: "Salary Structures", url: "/dashboard/payroll/salary-structures" },
            ]
          : []),
      ],
    },
    ...(isHR
      ? [
          {
            title: "Organization",
            url: "/dashboard/organization",
            icon: Building2,
            items: [
              { title: "Overview", url: "/dashboard/organization" },
              { title: "Departments", url: "/dashboard/organization/departments" },
              { title: "Holidays", url: "/dashboard/organization/holidays" },
            ],
          },
        ]
      : [
          {
            title: "Organization",
            url: "/dashboard/organization/holidays",
            icon: Building2,
            items: [
              { title: "Company Holidays", url: "/dashboard/organization/holidays" },
            ],
          },
        ]),
    ...(isHR
      ? [
          {
            title: "Reports",
            url: "/dashboard/reports",
            icon: BarChart3,
            items: [
              { title: "Overview", url: "/dashboard/reports" },
              { title: "Attendance", url: "/dashboard/reports/attendance" },
              { title: "Leave", url: "/dashboard/reports/leave" },
              { title: "Payroll", url: "/dashboard/reports/payroll" },
            ],
          },
        ]
      : []),
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings2,
      items: [
        { title: "General", url: "/dashboard/settings" },
        { title: "My Profile", url: "/dashboard/settings/profile" },
        ...(isAdmin ? [{ title: "Roles & Permissions", url: "/dashboard/settings/roles" }] : []),
      ],
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
