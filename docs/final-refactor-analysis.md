# Dayflow HRMS — Final Production Full-Stack Refactor Analysis

**Date:** 2026-08-22  
**Author:** Senior Staff Full-Stack Engineer  
**System:** Dayflow — Human Resource Management System ("Every workday, perfectly aligned.")  
**Stack:** Next.js 16.3.1 (App Router, Turbopack, Proxy), React 19.2.8, TypeScript 5, Tailwind CSS 4, Better Auth 1.7.1, Drizzle ORM 1.0.0-rc.4, Neon PostgreSQL, TanStack Query 5.101.4, Bun 1.3.14

---

## 1. Executive Summary & Inventory Overview

Dayflow HRMS is an established full-stack HRMS application. A substantial portion of the target `/api/v1/*` architecture and Drizzle schemas have been drafted or partially connected. However, structural inconsistencies, legacy role trees, naming typos, duplicate UI components/layouts, unused route segments, and linting errors prevent the application from reaching cohesive, production-grade stability.

This document presents a complete audit of the repository, classifies all findings by severity (**CRITICAL**, **HIGH**, **MEDIUM**, **LOW**), and outlines the exact step-by-step migration sequence to consolidate the application into a unified, secure, type-safe, and demonstrable production HRMS.

---

## 2. Current Route Tree vs. Target Architecture

### Current Next.js App Router Tree
```
src/app/
├── (auth)/
│   ├── sign-in/page.tsx
│   ├── signup/page.tsx               [MISMATCH: "signup" vs target canonical "/sign-up"]
│   └── verify-email/page.tsx
├── (dashboard)/
│   ├── layout.tsx                    [Canonical dashboard shell with SidebarProvider]
│   └── dashboard/
│       ├── (approvels)/              [TYPO: "(approvels)"]
│       │   └── approvels/leave/page.tsx [TYPO: route is /dashboard/approvels/leave]
│       ├── (attendence)/             [TYPO: "(attendence)"]
│       │   └── attendance/
│       │       ├── daily/page.tsx
│       │       ├── regularize/page.tsx [MISMATCH: "regularize" vs target "corrections"]
│       │       ├── weekly/page.tsx
│       │       └── page.tsx
│       ├── (organization)/
│       │   ├── holidays/page.tsx     [Route: /dashboard/holidays]
│       │   ├── organization/
│       │   │   ├── departments/page.tsx
│       │   │   └── page.tsx
│       │   └── roles/page.tsx        [Route: /dashboard/roles]
│       ├── (payroll)/
│       │   ├── payroll/page.tsx
│       │   └── structured/page.tsx   [MISMATCH: "structured" vs "salary-structures"]
│       ├── (people)/
│       │   └── people/
│       │       ├── billing/page.tsx
│       │       ├── onboarding/page.tsx
│       │       ├── profile/page.tsx
│       │       ├── settings/page.tsx
│       │       └── page.tsx
│       ├── (timeoff)/
│       │   └── time-off/
│       │       ├── apply/page.tsx
│       │       ├── balance/page.tsx
│       │       └── page.tsx
│       ├── settings/
│       │   ├── billing/page.tsx
│       │   ├── team/page.tsx
│       │   └── (general settings)
│       ├── data.json                 [STATIC MOCK: 615 lines of mock data]
│       └── page.tsx                  [Consolidated Dashboard overview]
├── (marketing)/
│   └── about/page.tsx
├── (user)/                           [OBSOLETE ROLE-SPECIFIC APPLICATION TREES]
│   ├── admin/page.tsx
│   ├── employee/page.tsx
│   ├── hr/page.tsx
│   └── manager/page.tsx
├── features/                         [OBSOLETE DUPLICATE ARTIFACT IN APP DIR]
│   └── attendance/page.tsx
└── page.tsx                          [Landing page with hero / background lines]
```

---

## 3. Current API Tree vs. Target Canonical Namespace

### 3.1 Non-Canonical / Legacy API Routes
- `src/app/api/notifications/route.ts` -> Alias/legacy redirect to `/api/v1/notifications`
- `src/app/api/payroll/payslips/route.ts` -> Alias/legacy redirect to `/api/v1/payroll/payslips`
- `src/app/api/payroll/periods/route.ts` -> Alias/legacy redirect to `/api/v1/payroll/periods`

### 3.2 Canonical `/api/v1/*` API Tree
```
src/app/api/v1/
├── activity-logs/route.ts
├── approvals/
│   ├── [approvalId]/
│   │   ├── approve/route.ts
│   │   ├── reject/route.ts
│   │   └── route.ts
│   └── route.ts
├── attendance/
│   ├── [attendanceId]/route.ts
│   ├── check-in/route.ts
│   ├── check-out/route.ts
│   ├── corrections/
│   │   ├── [correctionId]/route.ts
│   │   └── route.ts
│   └── route.ts
├── departments/
│   ├── [departmentId]/route.ts
│   └── route.ts
├── designations/
│   ├── [designationId]/route.ts
│   └── route.ts
├── employees/
│   ├── [employeeId]/
│   │   ├── attendance/route.ts
│   │   ├── payslips/route.ts
│   │   ├── time-off/route.ts
│   │   └── route.ts
│   └── route.ts
├── holidays/
│   ├── [holidayId]/route.ts
│   └── route.ts
├── leave-allocations/
│   ├── [allocationId]/route.ts
│   └── route.ts
├── leave-policies/
│   ├── [policyId]/route.ts
│   └── route.ts
├── leave-requests/
│   ├── [requestId]/
│   │   ├── approve/route.ts
│   │   ├── reject/route.ts
│   │   └── route.ts
│   └── route.ts
├── leave-types/
│   ├── [leaveTypeId]/route.ts
│   └── route.ts
├── locations/
│   ├── [locationId]/route.ts
│   └── route.ts
├── me/
│   ├── attendance/route.ts
│   ├── payslips/route.ts
│   ├── time-off/route.ts
│   └── route.ts
├── notifications/
│   ├── [notificationId]/route.ts
│   ├── read-all/route.ts
│   └── route.ts
├── organizations/
│   ├── [id]/route.ts
│   └── route.ts
├── payroll/
│   ├── payslips/
│   │   ├── [payslipId]/route.ts
│   │   └── route.ts
│   └── periods/
│       ├── [periodId]/
│       │   ├── calculate/route.ts
│       │   ├── finalize/route.ts
│       │   └── route.ts
│       └── route.ts
├── salary-structures/
│   ├── [salaryStructureId]/route.ts
│   └── route.ts
└── work-schedules/
    ├── [scheduleId]/route.ts
    └── route.ts
```

---

## 4. Database & Drizzle Schema Architecture

Database: **Neon PostgreSQL** via `@neondatabase/serverless` & `drizzle-orm`
Schemas located in `src/db/schema/`:
- `auth-schema.ts`: `user`, `session`, `account`, `verification` tables.
- `organizations.ts`: `organizations` table (tenant boundary).
- `departments.ts`: `departments` table (`organizationId`, `headId`).
- `designations.ts`: `designations` table (`organizationId`, `departmentId`).
- `locations.ts`: `locations` table (`organizationId`).
- `employees.ts`: `employees` table (`userId`, `organizationId`, `departmentId`, `designationId`, `role`, `employmentStatus`, `salary`).
- `attendances.ts`: `attendances` table (`organizationId`, `employeeId`, `date`, `checkInTime`, `checkOutTime`, `status`, `totalHours`).
- `attendance-corrections.ts`: `attendanceCorrections` table (`organizationId`, `employeeId`, `attendanceId`, `status`, `reviewerId`).
- `leave-types.ts`: `leaveTypes` table.
- `leave-policies.ts`: `leavePolicies` table.
- `leave-allocations.ts`: `leaveAllocations` table (`employeeId`, `leaveTypeId`, `allocatedDays`, `usedDays`).
- `leave-requests.ts`: `leaveRequests` table (`organizationId`, `employeeId`, `leaveTypeId`, `status`, `reviewerId`).
- `approval-requests.ts`: `approvalRequests` table (polymorphic approvals).
- `payroll-periods.ts`: `payrollPeriods` table (`status`: draft, calculated, reviewed, finalized).
- `salary-structures.ts` & `salary-components.ts`: Compensation building blocks.
- `payslips.ts` & `payslip-items.ts`: Generated payslips and line items.
- `notifications.ts`: User notifications.
- `activity-logs.ts`: Audit events.

---

## 5. Better Auth Architecture

- **Server Config:** `src/lib/auth.ts` initialized with `betterAuth`, `drizzleAdapter(db, ...)`, email/password provider, admin plugin, optional GitHub/Google OAuth providers.
- **Client Config:** `src/lib/auth-client.ts` using `createAuthClient` with `adminClient()`.
- **Handler:** `src/app/api/auth/[...all]/route.ts` with `toNextJsHandler(auth)`.
- **Identity Model:**
  ```
  Better Auth User (auth identity)
         ↓
  Employee Record (HR identity, userId, organizationId)
         ↓
  Role ("admin" | "hr" | "manager" | "employee")
         ↓
  Permissions (Granular RBAC matrix in src/lib/permissions.ts)
  ```
- **Context Helper:** `src/lib/auth-context.ts` provides `getAuthContext(headers)` and `requirePermission(permission)`.

---

## 6. Detailed Inventory of Issues & Severity Classification

### CRITICAL Findings
1. **[CRITICAL] Route & API Typos Breaking Navigation & Endpoints:**
   - Folder `src/app/(dashboard)/dashboard/(approvels)/approvels/leave` exposes `/dashboard/approvels/leave` (misspelled `approvels`).
   - Folder `src/app/(dashboard)/dashboard/(attendence)/` misspells attendance in directory names.
   - Folder `src/app/(dashboard)/dashboard/(attendence)/attendance/regularize` uses non-standard route `regularize` instead of `corrections`.
   - `src/app/(dashboard)/dashboard/(attendence)/attendance/page.tsx` line 215 makes requests to `/api/v1/attendence` (typo).
   - Folder `src/app/(dashboard)/dashboard/(payroll)/structured` uses `structured` instead of `salary-structures`.
2. **[CRITICAL] Obsolete Multi-App Trees:**
   - `src/app/(user)/admin`, `src/app/(user)/employee`, `src/app/(user)/hr`, `src/app/(user)/manager` represent four redundant role-specific application trees that bypass the unified `/dashboard` platform.
   - `src/app/features/` is an errant directory inside `src/app` causing rogue routes (`/features/attendance`).

### HIGH Findings
3. **[HIGH] ESLint Errors in Frontend & UI Components:**
   - `src/components/main/chart-area-interactive.tsx`: Calling `setState` synchronously within `useEffect` triggering cascading renders.
   - `src/components/ui/background-lines.tsx`: Impure `Math.random()` calls inside render body.
   - `src/hooks/use-mobile.ts`: Calling `setState` directly in effect.
   - `src/components/ui/background-ripple-effect.tsx`: `any` types.
   - `tests/auth-security.test.ts`: `any` casts.
4. **[HIGH] Duplicate UI Shell & Sidebar Implementations:**
   - `src/components/sidebar/sidebar.tsx` vs `src/components/main/app-sidebar.tsx`.
   - `src/components/sidebar/navmain.tsx` vs `src/components/main/nav-main.tsx`.
   - `src/components/sidebar/nav-user.tsx` vs `src/components/main/nav-user.tsx`.
5. **[HIGH] Signup URL Inconsistency:**
   - Frontend route is `/signup`, but standard links and proxy matcher expect `/sign-up`. Should support `/sign-up` canonically with seamless `/signup` redirect.

### MEDIUM Findings
6. **[MEDIUM] Static / Mock Data Residue:**
   - `src/app/(dashboard)/dashboard/data.json` exists as 615 lines of unused mock data.
7. **[MEDIUM] Direct fetch calls across pages instead of TanStack Query hooks:**
   - While routes call real `/api/v1/*` APIs, data-fetching is done via ad-hoc `fetch()` in `useEffect` rather than unified TanStack Query hooks, leading to manual loading states and lack of automatic query invalidation upon mutations.

### LOW Findings
8. **[LOW] Unused Variables and Dead Imports:**
   - Multiple unused imports across `src/features/payroll/payroll.repository.ts`, `src/lib/auth-context.ts`, `src/lib/api/validation.ts`.

---

## 7. Target Migration Sequence (Phase-by-Phase)

1. **Phase 1 — Audit & Baseline (Completed):**
   - Repository-wide inspection done. Baseline: Typecheck passes, Tests pass (5/5), Build passes, ESLint has 21 errors / 55 warnings to resolve.
2. **Phase 2 — Foundation & Lint Cleanup:**
   - Fix all ESLint errors in `use-mobile.ts`, `chart-area-interactive.tsx`, `background-lines.tsx`, `background-ripple-effect.tsx`, `hover-border-gradient.tsx`, `auth-security.test.ts`.
   - Consolidate UI shell components: Keep `src/components/sidebar/*` as canonical, remove duplicate dead components in `src/components/main/`.
3. **Phase 3 — Authentication & Identity Consolidation:**
   - Verify `src/proxy.ts` handles `/sign-in`, `/sign-up`, and `/signup`.
   - Ensure `src/app/(auth)/sign-up` is supported or mapped with `/signup`.
   - Verify signup form enforces safe non-privileged role assignment.
4. **Phase 4 — Route Tree Normalization & Consolidation:**
   - Migrate `(approvels)/approvels/leave` -> canonical `/dashboard/approvals/leave` and `/dashboard/approvals/attendance`.
   - Migrate `(attendence)/attendance` -> canonical `/dashboard/attendance` (with `daily`, `weekly`, `corrections`).
   - Migrate `(payroll)/structured` -> canonical `/dashboard/payroll/salary-structures` and `/dashboard/payroll/periods`.
   - Remove obsolete `src/app/(user)/` and `src/app/features/` trees after ensuring all features are in `/dashboard`.
   - Clean up `data.json`.
5. **Phase 5 — Domain APIs, Services & Mutation Invalidation:**
   - Ensure all frontend dashboard pages use canonical `/api/v1/*` endpoints without spelling errors (fix `/api/v1/attendence` -> `/api/v1/attendance`).
   - Standardize TanStack Query and invalidation on actions (check-in, check-out, leave application, approvals, payroll operations).
6. **Phase 6 — Verification & Seeding:**
   - Run typecheck, lint, build, test suite, and verify production build.
   - Document final state.
