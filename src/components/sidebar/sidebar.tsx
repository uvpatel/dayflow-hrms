"use client";

import * as React from "react";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  LayoutDashboard,
  Settings2,
  ShieldCheck,
  UserRound,
  Users,
  Wallet,
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
import { useMe } from "@/hooks/use-me";

type DayflowRole = "admin" | "hr" | "manager" | "employee";

function normalizeRole(role?: string | null): DayflowRole {
  const value = role?.toLowerCase();
  if (value === "admin" || value === "hr" || value === "manager") {
    return value;
  }
  return "employee";
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: me } = useMe();
  const role = normalizeRole(me?.user.role ?? me?.employee?.role);
  const canReview = role === "manager" || role === "hr" || role === "admin";
  const canManagePeople = role === "hr" || role === "admin";
  const canManageOrganization = role === "hr" || role === "admin";
  const isAdmin = role === "admin";

  const roleLabel =
    role === "admin"
      ? "Administrator"
      : role === "hr"
        ? "HR operations"
        : role === "manager"
          ? "Manager workspace"
          : "Employee workspace";

  const navMain: NavMainItem[] = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "My profile",
      url: "/dashboard/profile",
      icon: UserRound,
    },
    ...(canManagePeople
      ? [
          {
            title: "People",
            url: "/dashboard/people",
            icon: Users,
            items: [
              { title: "Directory", url: "/dashboard/people" },
              { title: "Onboarding", url: "/dashboard/people/onboarding" },
            ],
          },
        ]
      : role === "manager"
        ? [
            {
              title: "My team",
              url: "/dashboard/my-team",
              icon: Users,
            },
          ]
        : []),
    {
      title: "Attendance",
      url: "/dashboard/attendance",
      icon: CalendarCheck,
      items: [
        { title: "Overview", url: "/dashboard/attendance" },
        { title: "Daily view", url: "/dashboard/attendance/daily" },
        { title: "Weekly view", url: "/dashboard/attendance/weekly" },
        { title: "Corrections", url: "/dashboard/attendance/corrections" },
      ],
    },
    {
      title: "Time off",
      url: "/dashboard/time-off",
      icon: CalendarClock,
      items: [
        { title: "Requests", url: "/dashboard/time-off" },
        { title: "Apply", url: "/dashboard/time-off/apply" },
        { title: "Balances", url: "/dashboard/time-off/balance" },
      ],
    },
    ...(canReview
      ? [
          {
            title: "Approvals",
            url: "/dashboard/approvals",
            icon: CheckCircle2,
          },
        ]
      : []),
    {
      title: "Payroll",
      url: "/dashboard/payroll",
      icon: Wallet,
      items: [
        { title: "Payslips", url: "/dashboard/payroll" },
        ...(canManagePeople
          ? [
              { title: "Pay periods", url: "/dashboard/payroll/periods" },
              {
                title: "Salary structures",
                url: "/dashboard/payroll/salary-structures",
              },
            ]
          : []),
      ],
    },
    {
      title: "Organization",
      url: "/dashboard/organization",
      icon: Building2,
      items: [
        { title: "Overview", url: "/dashboard/organization" },
        { title: "Holidays", url: "/dashboard/holidays" },
        ...(canManageOrganization
          ? [
              { title: "Departments", url: "/dashboard/departments" },
              { title: "Designations", url: "/dashboard/designations" },
              { title: "Office locations", url: "/dashboard/office-locations" },
              { title: "Work schedules", url: "/dashboard/work-schedules" },
            ]
          : []),
      ],
    },
    ...(canReview
      ? [
          {
            title: "Reports",
            url: "/dashboard/reports",
            icon: BarChart3,
          },
        ]
      : []),
    {
      title: "Notifications",
      url: "/dashboard/notifications",
      icon: Bell,
    },
    ...(isAdmin
      ? [
          {
            title: "Audit logs",
            url: "/dashboard/audit-logs",
            icon: ShieldCheck,
          },
        ]
      : []),
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings2,
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher
          teams={[
            {
              name: "Dayflow",
              logo: Building2,
              plan: roleLabel,
            },
          ]}
        />
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
