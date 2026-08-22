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
import { Bell, Search, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  people: "People",
  onboarding: "Onboarding",
  profile: "Profile",
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
          variant="outline"
          size="sm"
          className="hidden md:flex items-center gap-2 text-xs text-muted-foreground h-8 px-3"
          onClick={() => {}}
        >
          <Search className="size-3.5" />
          <span>Quick search...</span>
          <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground relative"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-2 bg-primary rounded-full ring-2 ring-background" />
        </Button>

        <ModeToggle />
      </div>
    </header>
  );
}
