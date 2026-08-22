"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ModeToggle } from "@/components/toggler";
import { Bell, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  people: "People",
  onboarding: "Onboarding",
  profile: "Profile",
  "my-team": "My Team",
  personal: "Personal Details",
  job: "Job & Position",
  attendance: "Attendance",
  daily: "Daily Logs",
  weekly: "Weekly Timesheet",
  corrections: "Corrections",
  schedules: "Work Schedules",
  "time-off": "Time Off",
  apply: "Apply for Leave",
  balance: "Leave Balance",
  requests: "Leave Requests",
  calendar: "Leave Calendar",
  approvals: "Approvals",
  leave: "Leave Approvals",
  payroll: "Payroll",
  periods: "Pay Periods",
  payslips: "Payslips",
  "salary-structures": "Salary Structures",
  organization: "Organization",
  departments: "Departments",
  designations: "Designations",
  locations: "Locations",
  "office-locations": "Office Locations",
  "work-schedules": "Work Schedules",
  holidays: "Company Holidays",
  reports: "Reports",
  settings: "Settings",
  roles: "Roles & Permissions",
  security: "Security",
  billing: "Billing & Plans",
};

function formatSegmentLabel(segment: string): string {
  if (ROUTE_LABELS[segment]) return ROUTE_LABELS[segment];
  // If it's a numeric ID
  if (/^\d+$/.test(segment)) return `#${segment}`;
  // Title case formatted
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function SiteHeader({ title }: { title?: string }) {
  const pathname = usePathname() || "/dashboard";
  const segments = pathname.split("/").filter(Boolean);
  const { data: notifications = [] } = useNotifications();
  const unreadCount = notifications.filter((notification) => notification.read === 0).length;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background/95 backdrop-blur px-4 lg:px-6 z-10 transition-[width,height] ease-linear">
      {/* Left: Sidebar trigger & Dynamic Breadcrumb */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
        <Separator orientation="vertical" className="mx-1 h-4" />

        <Breadcrumb>
          <BreadcrumbList>
            {segments.map((segment, index) => {
              const href = `/${segments.slice(0, index + 1).join("/")}`;
              const isLast = index === segments.length - 1;
              const label = formatSegmentLabel(segment);

              return (
                <React.Fragment key={href}>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="font-medium text-foreground">
                        {title && index === segments.length - 1 ? title : label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink render={<Link href={href} />}>
                        {index === 0 ? (
                          <span className="flex items-center gap-1">
                            <Home className="size-3.5" />
                            <span className="hidden sm:inline">{label}</span>
                          </span>
                        ) : (
                          label
                        )}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Right: Quick actions, Notifications, Dark mode */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground relative"
          aria-label="Notifications"
          render={<Link href="/dashboard/notifications" />}
        >
          <Bell className="size-4" />
          {unreadCount > 0 ? (
            <span className="absolute right-1 top-1 flex min-w-3.5 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold leading-3.5 text-primary-foreground ring-2 ring-background">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>

        <ModeToggle />
      </div>
    </header>
  );
}
