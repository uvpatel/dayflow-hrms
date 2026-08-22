"use client";

import React, { useState } from "react";
import {
  Building2,
  Clock,
  CalendarDays,
  Bell,
  Save,

  DollarSign,
 
  Briefcase,

  Sliders,
 
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { SiteHeader } from "@/components/main/site-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);

  // Tab 1: Organization Profile
  const [companyName, setCompanyName] = useState("Dayflow Technologies Inc.");
  const [companyCode, setCompanyCode] = useState("DF-HQ-001");
  const [workEmail, setWorkEmail] = useState("hr@dayflow.app");
  const [contactPhone, setContactPhone] = useState("+1 (555) 019-2834");
  const [hqAddress, setHqAddress] = useState("100 Innovation Way, Suite 400, San Francisco, CA 94107");
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [currency, setCurrency] = useState("USD");
  const [website, setWebsite] = useState("https://dayflow.app");

  // Tab 2: Attendance & Shifts
  const [shiftStart, setShiftStart] = useState("09:00");
  const [shiftEnd, setShiftEnd] = useState("18:00");
  const [gracePeriod, setGracePeriod] = useState("15");
  const [fullDayHours, setFullDayHours] = useState("8.0");
  const [halfDayHours, setHalfDayHours] = useState("4.5");
  const [geofencing, setGeofencing] = useState(true);
  const [autoCheckOut, setAutoCheckOut] = useState(true);
  const [overtimeAllowed, setOvertimeAllowed] = useState(true);

  // Tab 3: Leave Quotas & Policies
  const [paidLeaveQuota, setPaidLeaveQuota] = useState("18");
  const [sickLeaveQuota, setSickLeaveQuota] = useState("10");
  const [casualLeaveQuota, setCasualLeaveQuota] = useState("7");
  const [maxCarryForward, setMaxCarryForward] = useState("5");
  const [requireManagerApproval, setRequireManagerApproval] = useState(true);
  const [allowHalfDayLeave, setAllowHalfDayLeave] = useState(true);
  const [probationLeaveAllowed, setProbationLeaveAllowed] = useState(false);

  // Tab 4: Notifications & Work Schedule
  const [dailyAttendanceDigest, setDailyAttendanceDigest] = useState(true);
  const [leaveRequestAlerts, setLeaveRequestAlerts] = useState(true);
  const [latePunchAlerts, setLatePunchAlerts] = useState(true);
  const [payrollReminders, setPayrollReminders] = useState(true);
  const [workDaysMode, setWorkDaysMode] = useState("5days");

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Simulate saving settings
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success("HRMS settings updated successfully!");
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col min-h-screen bg-background">
      <SiteHeader title="Settings & Organization" />

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-10 max-w-6xl mx-auto w-full">
        {/* Page Header */}
        <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Link href="/dashboard" className="hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium">Settings</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
              <Sliders className="size-7 text-primary" />
              HRMS Organization Settings
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure company policies, shift timings, leave quotas, and system automation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/dashboard/settings/billing">
              <Button variant="outline" size="sm" className="gap-1.5">
                <DollarSign className="size-4" />
                Billing & Plans
              </Button>
            </Link>
            <Link href="/dashboard/settings/team">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Briefcase className="size-4" />
                Team Showcase
              </Button>
            </Link>
          </div>
        </div>

        {/* Settings Form with Tabs */}
        <form onSubmit={handleSaveSettings}>
          <Tabs defaultValue="org" className="w-full space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 max-w-2xl">
              <TabsTrigger value="org" className="gap-2">
                <Building2 className="size-4 text-primary" />
                <span className="hidden sm:inline">Organization</span> Profile
              </TabsTrigger>
              <TabsTrigger value="attendance" className="gap-2">
                <Clock className="size-4 text-emerald-600" />
                Attendance & Shifts
              </TabsTrigger>
              <TabsTrigger value="leaves" className="gap-2">
                <CalendarDays className="size-4 text-amber-500" />
                Leave Policies
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="size-4 text-indigo-500" />
                Notifications
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: ORGANIZATION PROFILE */}
            <TabsContent value="org" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="size-5 text-primary" />
                    Company Information
                  </CardTitle>
                  <CardDescription>
                    Legal entity details, primary contact addresses, and corporate branding.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Legal Company Name *</Label>
                      <Input
                        id="companyName"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyCode">Company Registration / Code</Label>
                      <Input
                        id="companyCode"
                        value={companyCode}
                        onChange={(e) => setCompanyCode(e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="workEmail">Primary HR Email *</Label>
                      <Input
                        id="workEmail"
                        type="email"
                        value={workEmail}
                        onChange={(e) => setWorkEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Official Contact Phone</Label>
                      <Input
                        id="contactPhone"
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hqAddress">Headquarters Address</Label>
                    <Textarea
                      id="hqAddress"
                      value={hqAddress}
                      onChange={(e) => setHqAddress(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={timezone}
                        onValueChange={(val) => {
                          if (val) setTimezone(val);
                        }}
                      >
                        <SelectTrigger id="timezone">
                          <SelectValue placeholder="Select Timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/Los_Angeles">Pacific Time (US - UTC-8)</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time (US - UTC-5)</SelectItem>
                          <SelectItem value="Europe/London">London (GMT - UTC+0)</SelectItem>
                          <SelectItem value="Asia/Kolkata">India (IST - UTC+5:30)</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo (JST - UTC+9)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency">Payroll Currency</Label>
                      <Select
                        value={currency}
                        onValueChange={(val) => {
                          if (val) setCurrency(val);
                        }}
                      >
                        <SelectTrigger id="currency">
                          <SelectValue placeholder="Select Currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($) - US Dollar</SelectItem>
                          <SelectItem value="INR">INR (₹) - Indian Rupee</SelectItem>
                          <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                          <SelectItem value="GBP">GBP (£) - British Pound</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Company Portal / Website</Label>
                      <Input
                        id="website"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://company.com"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="submit" disabled={loading} className="gap-1.5">
                    <Save className="size-4" />
                    {loading ? "Saving..." : "Save Organization Settings"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* TAB 2: ATTENDANCE & SHIFTS */}
            <TabsContent value="attendance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="size-5 text-emerald-600" />
                    Shift Timings & Punctuality Rules
                  </CardTitle>
                  <CardDescription>
                    Define office hours, grace periods, minimum half-day hours, and automated punching rules.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="shiftStart">Default Shift Start Time</Label>
                      <Input
                        id="shiftStart"
                        type="time"
                        value={shiftStart}
                        onChange={(e) => setShiftStart(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shiftEnd">Default Shift End Time</Label>
                      <Input
                        id="shiftEnd"
                        type="time"
                        value={shiftEnd}
                        onChange={(e) => setShiftEnd(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gracePeriod">Late Grace Period (Minutes)</Label>
                      <Input
                        id="gracePeriod"
                        type="number"
                        min="0"
                        max="60"
                        value={gracePeriod}
                        onChange={(e) => setGracePeriod(e.target.value)}
                      />
                      <span className="text-[11px] text-muted-foreground">
                        Arrivals within {gracePeriod} mins won't be flagged as late.
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullDayHours">Full-Day Working Hours Required</Label>
                      <Input
                        id="fullDayHours"
                        type="number"
                        step="0.5"
                        value={fullDayHours}
                        onChange={(e) => setFullDayHours(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="halfDayHours">Half-Day Minimum Hours</Label>
                      <Input
                        id="halfDayHours"
                        type="number"
                        step="0.5"
                        value={halfDayHours}
                        onChange={(e) => setHalfDayHours(e.target.value)}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20">
                      <div>
                        <div className="font-semibold text-sm">Geofencing & IP Restriction</div>
                        <div className="text-xs text-muted-foreground">
                          Restricts check-in to designated office WiFi or GPS perimeter.
                        </div>
                      </div>
                      <Switch checked={geofencing} onCheckedChange={setGeofencing} />
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20">
                      <div>
                        <div className="font-semibold text-sm">Auto Check-Out at Midnight</div>
                        <div className="text-xs text-muted-foreground">
                          Automatically closes open punches at 23:59 if employee forgets to punch out.
                        </div>
                      </div>
                      <Switch checked={autoCheckOut} onCheckedChange={setAutoCheckOut} />
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20">
                      <div>
                        <div className="font-semibold text-sm">Overtime (OT) Tracking</div>
                        <div className="text-xs text-muted-foreground">
                          Calculate additional compensation for hours worked beyond shift schedule.
                        </div>
                      </div>
                      <Switch checked={overtimeAllowed} onCheckedChange={setOvertimeAllowed} />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="submit" disabled={loading} className="gap-1.5">
                    <Save className="size-4" />
                    {loading ? "Saving..." : "Save Attendance Rules"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* TAB 3: LEAVE POLICIES */}
            <TabsContent value="leaves" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarDays className="size-5 text-amber-500" />
                    Annual Leave Quotas & Allocation
                  </CardTitle>
                  <CardDescription>
                    Set yearly leave balances, carry-over rules, and approval hierarchy.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="paidLeave">Paid Time Off (PTO / Annual)</Label>
                      <Input
                        id="paidLeave"
                        type="number"
                        value={paidLeaveQuota}
                        onChange={(e) => setPaidLeaveQuota(e.target.value)}
                        className="font-bold text-lg"
                      />
                      <span className="text-[11px] text-muted-foreground">Days per employee / year</span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sickLeave">Sick Leaves</Label>
                      <Input
                        id="sickLeave"
                        type="number"
                        value={sickLeaveQuota}
                        onChange={(e) => setSickLeaveQuota(e.target.value)}
                        className="font-bold text-lg"
                      />
                      <span className="text-[11px] text-muted-foreground">Medical emergency days</span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="casualLeave">Casual Leaves</Label>
                      <Input
                        id="casualLeave"
                        type="number"
                        value={casualLeaveQuota}
                        onChange={(e) => setCasualLeaveQuota(e.target.value)}
                        className="font-bold text-lg"
                      />
                      <span className="text-[11px] text-muted-foreground">Unplanned personal leaves</span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxCarry">Max Carry Forward</Label>
                      <Input
                        id="maxCarry"
                        type="number"
                        value={maxCarryForward}
                        onChange={(e) => setMaxCarryForward(e.target.value)}
                        className="font-bold text-lg"
                      />
                      <span className="text-[11px] text-muted-foreground">Rollover to next year</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20">
                      <div>
                        <div className="font-semibold text-sm">Mandatory Manager Approval</div>
                        <div className="text-xs text-muted-foreground">
                          All leave requests must be approved by the reporting manager.
                        </div>
                      </div>
                      <Switch
                        checked={requireManagerApproval}
                        onCheckedChange={setRequireManagerApproval}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20">
                      <div>
                        <div className="font-semibold text-sm">Allow Half-Day Leaves</div>
                        <div className="text-xs text-muted-foreground">
                          Employees can apply for morning or afternoon half-day time off.
                        </div>
                      </div>
                      <Switch
                        checked={allowHalfDayLeave}
                        onCheckedChange={setAllowHalfDayLeave}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20">
                      <div>
                        <div className="font-semibold text-sm">Paid Leaves During Probation</div>
                        <div className="text-xs text-muted-foreground">
                          Allow employees to utilize paid leave balance during their 90-day probation period.
                        </div>
                      </div>
                      <Switch
                        checked={probationLeaveAllowed}
                        onCheckedChange={setProbationLeaveAllowed}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="submit" disabled={loading} className="gap-1.5">
                    <Save className="size-4" />
                    {loading ? "Saving..." : "Save Leave Policies"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* TAB 4: NOTIFICATIONS & WORK SCHEDULE */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="size-5 text-indigo-500" />
                    Automated Notifications & Work Week
                  </CardTitle>
                  <CardDescription>
                    Configure email digests, push notifications, and default company work schedules.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="workDays">Standard Work Week Schedule</Label>
                    <Select
                      value={workDaysMode}
                      onValueChange={(val) => {
                        if (val) setWorkDaysMode(val);
                      }}
                    >
                      <SelectTrigger id="workDays" className="w-full sm:w-80">
                        <SelectValue placeholder="Select work week" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5days">5 Days (Monday to Friday, Sat & Sun Off)</SelectItem>
                        <SelectItem value="altSat">5.5 Days (Alternate Saturdays Working)</SelectItem>
                        <SelectItem value="6days">6 Days (Monday to Saturday, Sunday Off)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20">
                      <div>
                        <div className="font-semibold text-sm">Daily Attendance Summary to HR</div>
                        <div className="text-xs text-muted-foreground">
                          Send automated 10:00 AM attendance summary of present/late/absent counts.
                        </div>
                      </div>
                      <Switch
                        checked={dailyAttendanceDigest}
                        onCheckedChange={setDailyAttendanceDigest}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20">
                      <div>
                        <div className="font-semibold text-sm">Instant Leave Request Alerts</div>
                        <div className="text-xs text-muted-foreground">
                          Notify managers immediately via email & in-app alerts when a request is submitted.
                        </div>
                      </div>
                      <Switch
                        checked={leaveRequestAlerts}
                        onCheckedChange={setLeaveRequestAlerts}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20">
                      <div>
                        <div className="font-semibold text-sm">Late Punch Automated Reminders</div>
                        <div className="text-xs text-muted-foreground">
                          Send a reminder notification to employees who have not clocked in past grace period.
                        </div>
                      </div>
                      <Switch
                        checked={latePunchAlerts}
                        onCheckedChange={setLatePunchAlerts}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20">
                      <div>
                        <div className="font-semibold text-sm">Payroll Cycle Cutoff Alerts</div>
                        <div className="text-xs text-muted-foreground">
                          Alert HR team 3 days prior to monthly payroll cutoff for attendance regularizations.
                        </div>
                      </div>
                      <Switch
                        checked={payrollReminders}
                        onCheckedChange={setPayrollReminders}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="submit" disabled={loading} className="gap-1.5">
                    <Save className="size-4" />
                    {loading ? "Saving..." : "Save Notification Preferences"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </div>
  );
}