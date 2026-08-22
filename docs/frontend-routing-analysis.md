# Dayflow HRMS — Frontend Routing Architecture & Migration Analysis

**"Every workday, perfectly aligned."**

---

## 1. Executive Summary & Audit Overview

This document presents the comprehensive audit, structural analysis, and migration strategy for the frontend routing architecture in **Dayflow HRMS** (Next.js 16 App Router). 

The existing codebase contains functional business logic, database schemas (Drizzle Neon PostgreSQL), and Better Auth integration, but suffers from inconsistent route group naming, misspelled URL paths, duplicate shell rendering across page files, missing hierarchical subroutes, and client-heavy page implementations.

This plan details the migration to a clean, production-grade Next.js App Router architecture leveraging route groups, feature-driven UI components, server-first data fetching, granular role-based authorization, and TanStack Query state synchronization.

---

## 2. Current vs. Target Route Tree Analysis

### 2.1. Current Route Tree

```text
src/app/
├── (auth)/
│   ├── sign-in/page.tsx
│   ├── signup/page.tsx
│   └── verify-email/page.tsx
├── (dashboard)/
│   ├── layout.tsx (DashboardLayout - Server session guard + SidebarProvider)
│   └── dashboard/
│       ├── page.tsx (Dashboard Overview)
│       ├── (approvels)/ [MISSPELLED]
│       │   └── approvels/leave/ [MISSPELLED PATH]
│       ├── (attendence)/ [MISSPELLED]
│       │   └── attendance/
│       │       ├── page.tsx
│       │       ├── daily/page.tsx
│       │       ├── weekly/page.tsx
│       │       └── regularize/page.tsx (Sidebar links to 'regulize')
│       ├── (organization)/
│       │   ├── holidays/page.tsx (Placed outside /organization/)
│       │   ├── organization/
│       │   │   ├── page.tsx
│       │   │   └── departments/page.tsx
│       │   └── roles/page.tsx (Placed outside /organization/)
│       ├── (payroll)/
│       │   ├── payroll/page.tsx
│       │   └── structured/page.tsx (Misnamed; should be salary-structures)
│       ├── (people)/
│       │   └── people/
│       │       ├── page.tsx
│       │       ├── onboarding/page.tsx
│       │       ├── profile/page.tsx
│       │       ├── billing/page.tsx
│       │       └── settings/page.tsx
│       ├── (timeoff)/
│       │   └── time-off/
│       │       ├── page.tsx
│       │       ├── apply/page.tsx
│       │       └── balance/page.tsx
│       └── settings/
│           ├── page.tsx
│           └── billing/page.tsx
├── (user)/ [OBSOLETE REDIRECT PLACEHOLDERS]
│   ├── admin/page.tsx (User role management)
│   ├── employee/page.tsx (Redirects to /dashboard)
│   ├── hr/page.tsx (Redirects to /dashboard)
│   └── manager/page.tsx (Redirects to /dashboard)
├── api/
│   ├── auth/[...all]/route.ts (Better Auth Canonical Handler)
│   └── v1/ (Production REST API Endpoints)
├── layout.tsx (RootLayout)
├── page.tsx (Landing Page)
└── not-found.tsx (404 Page)
```

---

## 3. Route Classification & Inventory

| Status | Current Route | Target Canonical Route | Reason / Action |
|---|---|---|---|
| **STAY** | `/` | `/` | Public landing page |
| **STAY** | `/sign-in` | `/sign-in` | Public authentication |
| **STAY / ALIAS** | `/signup` | `/sign-up` & `/signup` | Support standard hyphenated `/sign-up` with `/signup` alias |
| **STAY** | `/verify-email` | `/verify-email` | Email verification confirmation page |
| **CREATE** | *None* | `/forgot-password` | Password recovery page |
| **STAY** | `/dashboard` | `/dashboard` | Central role-aware dashboard entry point |
| **RENAME** | `/dashboard/approvels/leave` | `/dashboard/approvals/leave` | Fix spelling (`approvels` → `approvals`) |
| **CREATE** | *None* | `/dashboard/approvals` | Unified approval inbox with tabs (All, Leave, Attendance) |
| **CREATE** | *None* | `/dashboard/approvals/attendance` | Attendance regularize approvals |
| **REORGANIZE** | `(attendence)/attendance` | `attendance/` | Remove misspelled route group `(attendence)` |
| **STAY** | `/dashboard/attendance` | `/dashboard/attendance` | Main attendance overview |
| **STAY** | `/dashboard/attendance/daily` | `/dashboard/attendance/daily` | Daily punch logs |
| **STAY** | `/dashboard/attendance/weekly` | `/dashboard/attendance/weekly` | Weekly timesheets |
| **RENAME** | `/dashboard/attendance/regularize` | `/dashboard/attendance/corrections` | Align with standard naming (`corrections`) |
| **CREATE** | *None* | `/dashboard/attendance/corrections/[correctionId]` | Specific correction view |
| **CREATE** | *None* | `/dashboard/attendance/schedules` | Shift & work schedules |
| **REORGANIZE** | `(people)/people` | `people/` | Clean folder hierarchy |
| **STAY** | `/dashboard/people` | `/dashboard/people` | Employee directory & table |
| **STAY** | `/dashboard/people/onboarding` | `/dashboard/people/onboarding` | Add new employee multi-step flow |
| **CREATE** | *None* | `/dashboard/people/[employeeId]` | Employee profile dynamic root with shared layout |
| **CREATE** | *None* | `/dashboard/people/[employeeId]/personal` | Nested tab: Personal details |
| **CREATE** | *None* | `/dashboard/people/[employeeId]/job` | Nested tab: Job & designation details |
| **CREATE** | *None* | `/dashboard/people/[employeeId]/attendance` | Nested tab: Individual attendance logs |
| **CREATE** | *None* | `/dashboard/people/[employeeId]/time-off` | Nested tab: Individual leave balance & history |
| **CREATE** | *None* | `/dashboard/people/[employeeId]/payroll` | Nested tab: Individual salary & payslips |
| **CREATE** | *None* | `/dashboard/people/[employeeId]/documents` | Nested tab: Employee documents |
| **MIGRATE** | `/dashboard/people/profile` | `/dashboard/people/profile` & `[employeeId]` | Current user's self profile |
| **REORGANIZE** | `(timeoff)/time-off` | `time-off/` | Clean folder hierarchy |
| **STAY** | `/dashboard/time-off` | `/dashboard/time-off` | Time off overview & summary |
| **STAY** | `/dashboard/time-off/apply` | `/dashboard/time-off/apply` | Apply for leave form |
| **STAY** | `/dashboard/time-off/balance` | `/dashboard/time-off/balance` | Leave balance breakdown |
| **CREATE** | *None* | `/dashboard/time-off/requests` | All leave requests list |
| **CREATE** | *None* | `/dashboard/time-off/requests/[requestId]` | Specific leave request detail |
| **CREATE** | *None* | `/dashboard/time-off/calendar` | Team & organization leave calendar |
| **REORGANIZE** | `(organization)/organization` | `organization/` | Standardize nested organization paths |
| **STAY** | `/dashboard/organization` | `/dashboard/organization` | Organization overview / control center |
| **STAY** | `/dashboard/organization/departments` | `/dashboard/organization/departments` | Department management |
| **MIGRATE** | `/dashboard/roles` | `/dashboard/organization/designations` | Role/Designation management |
| **MIGRATE** | `/dashboard/holidays` | `/dashboard/organization/holidays` | Company holidays schedule |
| **CREATE** | *None* | `/dashboard/organization/locations` | Office & work locations |
| **CREATE** | *None* | `/dashboard/organization/schedules` | Organization work schedules |
| **REORGANIZE** | `(payroll)/payroll` | `payroll/` | Clean folder hierarchy |
| **STAY** | `/dashboard/payroll` | `/dashboard/payroll` | Payroll overview (HR/Admin) & Self payslips |
| **CREATE** | *None* | `/dashboard/payroll/periods` | Payroll pay period processing |
| **CREATE** | *None* | `/dashboard/payroll/periods/[periodId]` | Pay period detail & calculation |
| **CREATE** | *None* | `/dashboard/payroll/payslips` | Payslip generator and batch export |
| **CREATE** | *None* | `/dashboard/payroll/payslips/[payslipId]` | Payslip printable view |
| **RENAME** | `/dashboard/structured` | `/dashboard/payroll/salary-structures` | Move & rename salary structures |
| **CREATE** | *None* | `/dashboard/payroll/salary-structures/[structureId]` | Salary structure editor |
| **CREATE** | *None* | `/dashboard/reports` | Analytics & Reports Overview |
| **CREATE** | *None* | `/dashboard/reports/attendance` | Attendance report |
| **CREATE** | *None* | `/dashboard/reports/leave` | Leave & absence report |
| **CREATE** | *None* | `/dashboard/reports/payroll` | Payroll & salary cost report |
| **CREATE** | *None* | `/dashboard/reports/employees` | Headcount & turnover report |
| **STANDARDIZE**| `/dashboard/settings` | `/dashboard/settings` | General settings |
| **CREATE** | *None* | `/dashboard/settings/profile` | Profile settings |
| **CREATE** | *None* | `/dashboard/settings/organization` | Organization company settings |
| **CREATE** | *None* | `/dashboard/settings/roles` | RBAC permissions & roles |
| **CREATE** | *None* | `/dashboard/settings/security` | Password, 2FA, session security |
| **REMOVE** | `(user)/admin` | `/dashboard/settings/roles` & `/admin` | Move user management under dashboard settings |
| **REMOVE** | `(user)/employee`, `hr`, `manager` | *None* | Redundant empty placeholder folders |

---

## 4. Layout & Shell Architecture

### 4.1. The Single Dashboard Shell Problem
Currently:
- `src/app/(dashboard)/layout.tsx` validates the session and wraps `{children}` inside `<SidebarProvider>`, `<AppSidebar>`, and `<SidebarInset>`.
- However, `<SiteHeader />` is **not** inside `(dashboard)/layout.tsx`. As a result, **19 individual page components** manually imported and rendered `<SiteHeader />` inside their own JSX!
- Additionally, `RootLayout` (`src/app/layout.tsx`) contained an extra top `<header>` element with a theme toggle that showed up on top of every dashboard page.

### 4.2. Target Architecture
```text
RootLayout (src/app/layout.tsx)
  │ (ThemeProvider, TooltipProvider, QueryProvider, Toaster)
  │
  ├── Public Pages (/ , /sign-in, /sign-up, /verify-email)
  │
  └── Dashboard Shell (src/app/(dashboard)/layout.tsx)
        │ (Authoritative Server Session Check -> redirect /sign-in)
        └── SidebarProvider
              ├── AppSidebar (Dynamic role-based navigation + active route indicator)
              └── SidebarInset
                    ├── SiteHeader (Persistent top header)
                    │     ├── SidebarTrigger
                    │     ├── Separator
                    │     ├── Breadcrumb (Dynamic hierarchical path resolution)
                    │     ├── Global Search / Command Bar
                    │     ├── Notification Bell
                    │     └── NavUser Menu (Profile, Theme, Sign Out)
                    │
                    └── {children} (Pure page content without header duplication)
```

---

## 5. Breadcrumb & Navigation Systems

### 5.1. Breadcrumb Resolution
The current `SiteHeader` displays `pathname.split("/").pop()` as a static string.
The target breadcrumb will resolve hierarchical route paths:
- `/dashboard` → `Dashboard`
- `/dashboard/people` → `Dashboard` / `People`
- `/dashboard/people/12` → `Dashboard` / `People` / `Urvil Patel` (via employee name query or fallback to `Employee #12`)
- `/dashboard/people/12/attendance` → `Dashboard` / `People` / `Urvil Patel` / `Attendance`
- `/dashboard/attendance/daily` → `Dashboard` / `Attendance` / `Daily`
- `/dashboard/payroll/salary-structures` → `Dashboard` / `Payroll` / `Salary Structures`

### 5.2. Sidebar Active Route Matching
The sidebar must highlight the active module when navigating deep into subroutes:
- When on `/dashboard/people/12/personal`, the `People` parent item remains active.
- When on `/dashboard/attendance/daily`, the `Attendance` parent item remains active.
- When on `/dashboard/payroll/periods/4`, the `Payroll` parent item remains active.

---

## 6. Authentication, Authorization & Security Boundaries

1. **Server-Side Session Validation:** Handled authoritatively in `src/app/(dashboard)/layout.tsx` using `auth.api.getSession({ headers })`.
2. **Next 16 Proxy Middleware:** Handled in `src/proxy.ts` to prevent flash of protected routes or redirect authenticated users from login.
3. **Role & Tenant Isolation:**
   - Regular `employee`: Sees only their self-service data (`/dashboard/attendance`, `/dashboard/time-off`, `/dashboard/people/profile`, `/dashboard/payroll` own payslips).
   - `manager`: Accesses team-scoped approvals (`/dashboard/approvals/leave`, `/dashboard/approvals/attendance`).
   - `hr` / `admin`: Full organizational management, payroll processing, employee directory, and department configuration.

---

## 7. API Connectivity Matrix

| Frontend Route | Target REST Endpoint | Method | Role Permission Guard |
|---|---|---|---|
| `/dashboard` | `/api/v1/employees`, `/api/v1/attendance`, `/api/v1/leave-requests`, `/api/v1/holidays` | `GET` | Authenticated Session |
| `/dashboard/people` | `/api/v1/employees` | `GET` | `employee:read:any` (or self) |
| `/dashboard/people/onboarding` | `/api/v1/employees` | `POST` | `employee:create` (HR / Admin) |
| `/dashboard/people/[employeeId]` | `/api/v1/employees/:employeeId` | `GET`, `PATCH`, `DELETE` | `employee:read` / `employee:update` |
| `/dashboard/people/[employeeId]/attendance` | `/api/v1/attendance?employeeId=:id` | `GET` | `attendance:read` |
| `/dashboard/people/[employeeId]/time-off` | `/api/v1/leave-requests?employeeId=:id` | `GET` | `leave:read` |
| `/dashboard/people/[employeeId]/payroll` | `/api/v1/payroll/payslips?employeeId=:id` | `GET` | `payroll:read` |
| `/dashboard/attendance` | `/api/v1/attendance`, `/api/v1/attendance/check-in` | `GET` | Authenticated Session |
| `/dashboard/attendance/daily` | `/api/v1/attendance?view=daily` | `GET` | Authenticated Session |
| `/dashboard/attendance/weekly` | `/api/v1/attendance?view=weekly` | `GET` | Authenticated Session |
| `/dashboard/attendance/corrections` | `/api/v1/attendance/corrections` | `GET`, `POST` | Authenticated Session |
| `/dashboard/time-off` | `/api/v1/leave-requests` | `GET` | Authenticated Session |
| `/dashboard/time-off/apply` | `/api/v1/leave-requests` | `POST` | `leave:create` |
| `/dashboard/time-off/balance` | `/api/v1/leave-allocations` | `GET` | `leave:self` |
| `/dashboard/approvals` | `/api/v1/approvals` | `GET` | `approval:manage` |
| `/dashboard/approvals/leave` | `/api/v1/leave-requests/:id/approve` | `POST` | `leave:manage` |
| `/dashboard/organization/departments` | `/api/v1/departments` | `GET`, `POST` | `organization:manage` |
| `/dashboard/organization/holidays` | `/api/v1/holidays` | `GET`, `POST` | Authenticated Session |
| `/dashboard/payroll` | `/api/v1/payroll/payslips` | `GET` | `payroll:read:self` / `payroll:read:any` |
| `/dashboard/payroll/periods` | `/api/v1/payroll/periods` | `GET`, `POST` | `payroll:manage` |
| `/dashboard/payroll/salary-structures`| `/api/v1/payroll/salary-structures` | `GET`, `POST` | `payroll:manage` |
| `/dashboard/settings/profile` | `/api/v1/me` | `GET`, `PATCH` | Authenticated Session |

---

## 8. Phased Implementation Roadmap

* **Phase 1: Shell & Core Navigation Fix (IMMEDIATE):**
  - Standardize `src/app/layout.tsx` (remove root header, add `QueryProvider` and `Toaster`).
  - Upgrade `src/app/(dashboard)/layout.tsx` to include persistent `SiteHeader` with real dynamic breadcrumbs.
  - Upgrade `AppSidebar` with robust `usePathname()` active matching and clean canonical routes.
  - Remove redundant `<SiteHeader />` from individual dashboard pages.
* **Phase 2: Organization Routes:**
  - Standardize `/dashboard/organization`, `/departments`, `/designations`, `/locations`, `/holidays`, `/schedules`.
* **Phase 3: People & Employee Profile Subroutes:**
  - Standardize `/dashboard/people`, `/dashboard/people/onboarding`, and nested `/dashboard/people/[employeeId]/layout.tsx` with tabs (`personal`, `job`, `attendance`, `time-off`, `payroll`, `documents`).
* **Phase 4: Attendance & Time Tracking:**
  - Standardize `/dashboard/attendance`, `/daily`, `/weekly`, `/corrections`, `/schedules`.
* **Phase 5: Time Off & Leave Management:**
  - Standardize `/dashboard/time-off`, `/apply`, `/balance`, `/requests`, `/calendar`.
* **Phase 6: Approvals:**
  - Standardize `/dashboard/approvals`, `/leave`, `/attendance`.
* **Phase 7: Payroll & Salary Structures:**
  - Standardize `/dashboard/payroll`, `/periods`, `/payslips`, `/salary-structures`.
* **Phase 8: Reports & Analytics:**
  - Implement `/dashboard/reports`, `/attendance`, `/leave`, `/payroll`, `/employees`.
* **Phase 9: Settings:**
  - Standardize `/dashboard/settings`, `/profile`, `/organization`, `/roles`, `/security`.
* **Phase 10: Final Verification, TypeScript & Build Polish:**
  - Verify all routes, loading states, error boundaries, and production build.

---
*Document generated for Dayflow HRMS Architecture Execution.*
