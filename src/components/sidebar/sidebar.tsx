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
} from "lucide-react";

import { NavMain } from "@/components/sidebar/navmain";
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
      name: isAdmin ? "Dayflow Admin" : isHR ? "Dayflow HR" : isManager ? "Dayflow Team" : "Dayflow HRMS",
      logo: Building2,
      plan: isAdmin ? "Enterprise Admin" : "Workforce",
    },
  ];

  // Dynamic role-aware navigation
  const navMain = [
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
              { title: "Profile", url: "/dashboard/people/profile" },
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
        { title: "Daily View", url: "/dashboard/attendance/daily" },
        { title: "Weekly View", url: "/dashboard/attendance/weekly" },
        { title: "Regularization", url: "/dashboard/attendance/regulize" },
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
            url: "/dashboard/approvels/leave",
            icon: CheckCircle2,
            items: [
              { title: "Leave Requests", url: "/dashboard/approvels/leave" },
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
        ...(isHR ? [{ title: "Salary Structure", url: "/dashboard/structured" }] : []),
      ],
    },
    ...(isHR
      ? [
          {
            title: "Organization",
            url: "/dashboard/organization",
            icon: Building2,
            items: [
              { title: "Departments", url: "/dashboard/organization/departments" },
              { title: "Roles", url: "/dashboard/roles" },
              { title: "Holidays", url: "/dashboard/holidays" },
            ],
          },
        ]
      : [
          {
            title: "Organization",
            url: "/dashboard/holidays",
            icon: Building2,
            items: [
              { title: "Holidays", url: "/dashboard/holidays" },
            ],
          },
        ]),
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings2,
      items: [
        { title: "General", url: "/dashboard/settings" },
        { title: "Billing", url: "/dashboard/settings/billing" },
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
